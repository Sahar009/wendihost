import Select from "@/components/utils/Select"
import { DASHBOARD_ROUTES } from "@/libs/enums"

import axios, { AxiosResponse } from "axios"
import useSWR from 'swr'
import Link from "next/link"
import { useState, useEffect } from "react"
import { ApiResponse, ChatsResponse } from "@/libs/types"
import { Campaign, Contact, Conversation, MetaAd } from "@prisma/client"
import { useDispatch, useSelector } from "react-redux"
import { getFilter, getSort, getView, setFilterBy, setSortedBy, setView } from "@/store/slices/conversationSlice"
import NewChat from "./NewChat"
import Image from "next/image"
import { getCurrentWorkspace } from "@/store/slices/system"
import { Calendar, ChevronDown, Search, X } from 'lucide-react';
import { format, subDays, isAfter, isBefore, endOfDay, startOfDay } from 'date-fns';
import { useRouter } from 'next/router';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface Chat extends Conversation {
  contact: Contact[];
  campaign?: Campaign | null;
  metaAd?: MetaAd | null;
}

const filter = [
    { name: "Open", value: "open" },
    { name: "Closed", value: "closed" },
]

const sort = [
    { name: "Newest", value: "newest" },
    { name: "Oldest", value: "oldest" },
]

const sourceOptions = [
    { name: 'All Sources', value: 'all' },
    { name: 'Campaign', value: 'CAMPAIGN' },
    { name: 'Meta Ads', value: 'META_ADS' },
    { name: 'Direct', value: 'DIRECT' }
]


interface IChats extends Conversation {
    contact: Contact[];
    campaign?: Campaign | null;
    metaAd?: MetaAd | null;
}

const ContactList = () => {
    const router = useRouter();
    const filterBy = useSelector(getFilter);
    const sortedBy = useSelector(getSort);
    const view = useSelector(getView);
    const dispatch = useDispatch();

    const [filterBy_, setFilterBy_] = useState<string>(filterBy);
    const [sortedBy_, setSortedBy_] = useState<string>(sortedBy);
    const { id: workspaceId } = useSelector(getCurrentWorkspace) || {};
    const [data, setData] = useState<Chat[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [campaigns, setCampaigns] = useState<{id: number, name: string}[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const { data: campaignsData } = useSWR<AxiosResponse<ApiResponse<Campaign[]>>>(
        workspaceId ? `/api/campaign?workspaceId=${workspaceId}` : null,
        axios
    )

    const buildQueryParams = () => {
        const params = new URLSearchParams()
        params.append('page', '1')
        params.append('filterBy', filterBy)
        params.append('sortedBy', sortedBy)
        params.append('view', view)
        
        if (sourceFilter !== 'all') {
            params.append('source', sourceFilter)
        }
        
        if (selectedCampaign) {
            params.append('campaignId', selectedCampaign)
        }
        
        if (dateRange?.from) {
            params.append('startDate', dateRange.from.toISOString())
        }
        
        if (dateRange?.to) {
            params.append('endDate', dateRange.to.toISOString())
        }
        
        return params.toString()
    }

    const getChats = useSWR<AxiosResponse<ApiResponse<ChatsResponse>>>(
        workspaceId ? `/api/${workspaceId}/chats/get?${buildQueryParams()}` : null,
        axios,
        { 
            refreshInterval: 5000,
            revalidateOnFocus: false
        }
    )

    useEffect(() => {
        if (dateRange && getChats?.mutate) {
            getChats.mutate();
        }
    }, [dateRange, getChats?.mutate]);

    useEffect(() => {
        const campaigns = campaignsData?.data?.data;
        if (campaigns) {
            setCampaigns(campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name
            })));
        }
    }, [campaignsData])

    useEffect(() => {
        const responseData = getChats?.data?.data?.data;
        if (responseData?.chats) {
            setData(responseData.chats);
        }
    }, [getChats?.data])

    useEffect(() => {
        dispatch(setSortedBy(sortedBy_))
    }, [sortedBy_, dispatch])

    useEffect(() => {
        dispatch(setFilterBy(filterBy_))
    }, [filterBy_, dispatch])

    const filter2 = (view: string) => {
        dispatch(setView(view))
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="bg-[#f0f2f5] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Image width={40} height={40} className="rounded-full" alt='Profile' src={"/icons/user-profile.png"} />
                    <span className="ml-3 font-medium">Chats</span>
                </div>
                <NewChat />
            </div>

            {/* Search and Filters */}
            <div className="px-4 py-2 bg-white border-b">
                {/* Search Input */}
                <div className="mb-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 bg-[#f5f6fa] focus:outline-none focus:ring-2 focus:ring-[#e5e7eb]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 mb-2">
                    <button className={`px-4 py-1.5 rounded-full text-sm ${view === 'all' ? "bg-[#e5e7eb] text-black" : "text-gray-600"}`} onClick={() => filter2('all')}>All</button>
                    <button className={`px-4 py-1.5 rounded-full text-sm ${view === 'mine' ? "bg-[#e5e7eb] text-black" : "text-gray-600"}`} onClick={() => filter2('mine')}>Mine</button>
                    <button className={`px-4 py-1.5 rounded-full text-sm ${view === 'unassigned' ? "bg-[#e5e7eb] text-black" : "text-gray-600"}`} onClick={() => filter2('unassigned')}>Unassigned</button>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Select label="" select={filterBy} id={"filter"} name={"filter"} lists={filter} onChange={setFilterBy_} />
                        <Select label="" select={sortedBy} id={"sortby"} name={"sortby"} lists={sort} onChange={setSortedBy_} />
                    </div>
                    
                    {/* Source Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Source</label>
                        <Select 
                            label="" 
                            select={sourceFilter}
                            id="source"
                            name="source"
                            lists={sourceOptions}
                            onChange={setSourceFilter}
                        />
                    </div>

                    {/* Campaign Filter (only show if source is CAMPAIGN) */}
                    {sourceFilter === 'CAMPAIGN' && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Campaign</label>
                            <Select
                                label=""
                                select={selectedCampaign}
                                id="campaign"
                                name="campaign"
                                lists={[
                                    { name: 'All Campaigns', value: '' },
                                    ...campaigns.map(c => ({ name: c.name, value: c.id.toString() }))
                                ]}
                                onChange={setSelectedCampaign}
                            />
                        </div>
                    )}

                    {/* Date Range Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Date Range</label>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="date"
                                    className="text-sm border rounded p-2 w-full"
                                    value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : undefined;
                                        setDateRange((prev: DateRange | undefined) => ({
                                            ...prev,
                                            from: date,
                                            to: date && prev?.to && isBefore(date, prev.to) ? prev.to : date
                                        }));
                                    }}
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="date"
                                    className="text-sm border rounded p-2 w-full"
                                    value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                                    min={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : undefined;
                                        setDateRange((prev: DateRange | undefined) => ({
                                            ...prev,
                                            from: prev?.from && date && isAfter(prev.from, date) ? date : prev?.from,
                                            to: date
                                        }));
                                    }}
                                />
                                {dateRange && (
                                    <button 
                                        onClick={() => setDateRange(undefined)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                        title="Clear dates"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {data
                  .filter((conversation) => {
                    const contact = conversation?.contact?.[0];
                    const name = contact ? `${contact.firstName} ${contact.lastName}` : '';
                    const phone = conversation.phone || '';
                    const term = searchTerm.toLowerCase();
                    
                    const matchesSearch = name.toLowerCase().includes(term) || phone.toLowerCase().includes(term);
                    
                    let matchesDateRange = true;
                    if (dateRange?.from || dateRange?.to) {
                      const messageDate = new Date(conversation.createdAt);
                      
                      if (dateRange.from) {
                        const startDate = startOfDay(new Date(dateRange.from));
                        if (isBefore(messageDate, startDate)) {
                          matchesDateRange = false;
                        }
                      }
                      
                      if (matchesDateRange && dateRange.to) {
                        const endDate = endOfDay(new Date(dateRange.to));
                        if (isAfter(messageDate, endDate)) {
                          matchesDateRange = false;
                        }
                      }
                    }
                    
                    return matchesSearch && matchesDateRange;
                  })
                  .map((conversation: Chat, index: number) => {
                    const contact = conversation?.contact?.[0]
                    return (
                        <Link href={`${DASHBOARD_ROUTES.CHATS}/${conversation?.phone}`} key={index}>
                            <div className="flex items-center px-4 py-3 hover:bg-[#f0f2f5] cursor-pointer border-b border-gray-100">
                                <Image 
                                    width={50} 
                                    height={50} 
                                    className="rounded-full"
                                    alt='USER' 
                                    src={"/icons/user-profile.png"} 
                                />
                                <div className="ml-4 flex-1">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-base text-l ">
                                            {contact ? `${contact.firstName} ${contact.lastName}` : 'New User'}
                                        </h2>
                                        {!conversation.read && (
                                            <span className="bg-[#25D366] text-white text-xs px-2 py-1 rounded-full">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{conversation.phone}</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default ContactList