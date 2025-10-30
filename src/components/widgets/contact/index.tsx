import Card from '@/components/dashboard/Card'
import { useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '@/libs/types'
import useSWR from 'swr'
import Tabs from '@/components/dashboard/Tabs'
import { IConversationCounts } from '@/libs/interfaces'
import ContactList from './ContactList'
import { getCurrentWorkspace } from '@/store/slices/system'
import { useSelector } from 'react-redux'


export default function Contact() {

    const [counts, setCounts] = useState<IConversationCounts | null>(null)
    const [tabIndex, setTabIndex] = useState(0)

    const workspaceFromStore = useSelector(getCurrentWorkspace)
    const workspaceId = workspaceFromStore?.id ?? 0
    
    const getCounts = useSWR(workspaceId && workspaceId > 0 ? `/api/${workspaceId}/chats/counts` : null, axios)

    useEffect(() => {
        const res = getCounts?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) {
            setCounts(data?.data)
        }
    }, [getCounts])

    const renderTabContent = (title: string, count: number | undefined, isActive: boolean) => {
        return (
            <div className='flex justify-between sm:justify-around items-center w-full py-2 sm:py-3 px-1 sm:px-0'>
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                    {title}
                </span>
                <span className={`text-xs sm:text-sm font-semibold px-2 py-0.5 sm:py-1 rounded-full min-w-[24px] text-center ${
                    isActive ? 'bg-primary text-white' : 'bg-gray-100 sm:bg-gray-200 text-gray-600'
                }`}>
                    {count ?? 0}
                </span>
            </div>
        )
    }

    const tabs = [
        { title: 'Open', count: counts?.open },
        { title: 'Assigned', count: counts?.assigned },
        { title: 'Unassigned', count: counts?.unassigned }
    ]

    if (!workspaceId || workspaceId <= 0) {
        return (
            <div className='h-auto min-h-[400px] sm:h-[500px] lg:h-[600px] w-full'>
                <Card className='h-full flex flex-col'>
                    <div className='pb-2 sm:pb-4 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-4'>
                        <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-6'>Contacts</h3>
                    </div>
                    <div className='flex-1 flex items-center justify-center'>
                        <div className='text-gray-500 text-center'>
                            <p>No workspace selected</p>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className='h-auto min-h-[400px] sm:h-[500px] lg:h-[600px] w-full'>
            <Card className='h-full flex flex-col'>
                <div className='pb-2 sm:pb-4 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-4'>
                    <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-6'>Contacts</h3>
                    <div className='flex justify-between bg-gray-50 rounded-lg p-0.5 sm:p-1 space-x-1 overflow-x-auto no-scrollbar'>
                        {tabs.map((tab, index) => (
                            <button 
                                key={tab.title}
                                onClick={() => setTabIndex(index)}
                                className={`flex-1 min-w-[100px] sm:min-w-0 text-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    tabIndex === index 
                                        ? 'bg-white shadow-sm' 
                                        : 'hover:bg-gray-50 active:bg-gray-100'
                                }`}
                                tabIndex={0}
                            >
                                {renderTabContent(tab.title, tab.count, tabIndex === index)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className='flex-1 overflow-hidden px-3 sm:px-6 py-2 sm:py-4'>
                    <div className='h-full overflow-y-auto'>
                        <ContactList index={tabIndex} />
                    </div>
                </div>
            </Card>
        </div>
    )

}
