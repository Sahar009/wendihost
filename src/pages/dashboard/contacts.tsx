import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AddContact from '@/components/dashboard/contacts/AddContact'
import ImportContact from '@/components/dashboard/contacts/ImportContact'
import ContactTable from '@/components/dashboard/tables/contactTables'
import LoadingButton from '@/components/utils/LoadingButton'
import ModalWrapper from '@/components/utils/ModalWrapper'
import { ApiResponse } from '@/libs/types'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import axios, { AxiosResponse } from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import useSWR, { mutate } from 'swr'
import { downloadCsv } from '@/libs/utils'
import { json2csv } from 'json-2-csv'
import TemplatePreprocessor from '@/components/dashboard/template/TemplatePreprocessor'
import { useSelector } from 'react-redux'
import { getCurrentWorkspace } from '@/store/slices/system'

interface Contact {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    email: string | null;
    tag: string;
    additionalInfo: string;
    workspaceId: number;
    conversationId: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}

interface ContactsResponse {
    data: Contact[];
    total: number;
    page: number;
    limit: number;
    tags?: { tag: string }[];
}

// Create an axios instance that always sends credentials
const axiosWithCreds = axios.create({ withCredentials: true });

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {

    const user = await validateUser(req)

    const data = user as any

    if (data?.redirect) return sessionRedirects(data?.redirect)

    return {
        props: {
            user: JSON.stringify(user),
        },
    }

}, sessionCookie())


interface IProps {
    user: string;
}

export default function Contacts(props: IProps) {

    const router = useRouter()

    const [page, setPage] = useState(1)

    const [open, setOpen] = useState(false)

    const [broadcast, setBroadcast] = useState(false)

    const [loading, setLoading] = useState(false)

    const [addContact, setAddContact] = useState(false)

    const [data, setData] = useState<ContactsResponse | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    const [selectedContacts, setSelectedContacts] = useState<number[]>([])

    const user = JSON.parse(props.user)

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getData = useSWR<AxiosResponse>(`/api/${workspaceId}/contacts/get?page=${page}`, (url: string) => axiosWithCreds.get(url));
    

    useEffect(() => {
        const res = getData?.data
        const responseData = res?.data

        if (responseData?.data) {
            // Transform the data structure to match the expected interface
            const transformedData = {
                data: responseData.data.contacts || [], // Extract the contacts array
                total: responseData.data.counts || 0,
                page: page,
                limit: 10, // Default limit, you might want to get this from the API response
                tags: responseData.data.tags || []
            };
            
            // Also create the format expected by ContactTable
            const contactTableData = {
                contacts: responseData.data.contacts || [],
                counts: responseData.data.counts || 0
            };
            setData(transformedData);
            setDataLoaded(true);
        } else {
            setDataLoaded(true); // Mark as loaded even if no data
        }
    }, [getData, page])

    useEffect(() => {
        const pageParam = router.query.page
        const pageNumber = pageParam ? Number(pageParam) : 1
        setPage(pageNumber > 0 ? pageNumber : 1)
    }, [router.query.page, router])

    // Reset dataLoaded when workspace changes
    useEffect(() => {
        setDataLoaded(false);
        setData(null);
    }, [workspaceId])

    const refresh = () => {
        mutate(`/api/${workspaceId}/contacts/get?page=${page}`)
    }

    const handleClose = () => {
        setOpen(false)
    }

    const handleCloseContact = () => {
        setAddContact(false)
    }

    const handleCloseBroadcast = () => {
        setBroadcast(false)
    }


    const onExport = async () => {

        setLoading(true)

        try {

            const res = await axios.get(`/api/${workspaceId}/contacts/export`)

            downloadCsv((await json2csv(res.data.data)), `contact_${Date.now()}`)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        setLoading(false)

    }


    return (
        <DashboardLayout user={user}>
            <div className='my-4 px-4 sm:px-6 lg:px-8'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
                    <div className='w-full md:w-1/3'>
                        <h1 className='text-2xl font-semibold mb-2 text-gray-900'>Contacts</h1>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search contacts...'
                                className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                            />
                            <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                                <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className='grid grid-cols-2 sm:grid-cols-2 md:flex gap-2 w-full md:w-auto'>
                        <div className='w-full md:w-36'><LoadingButton
                            className='w-full text-sm md:text-base border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white transition-colors'
                            disabled={!data}
                            onClick={() => setBroadcast(true)}
                            color="blue"
                        >Broadcast</LoadingButton></div>
                        <div className='w-full md:w-32'><LoadingButton
                            className='w-full text-sm md:text-base border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white transition-colors'
                            onClick={() => setAddContact(true)}
                            color="blue"
                        >+ Add</LoadingButton></div>
                        <div className='w-full md:w-36'><LoadingButton
                            className='w-full text-sm md:text-base border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white transition-colors'
                            onClick={() => setOpen(true)}
                            color="blue"
                        >Import</LoadingButton></div>
                        <div className='w-full md:w-36'><LoadingButton
                            className='w-full text-sm md:text-base border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white focus:bg-primary-500 focus:text-white transition-colors'
                            loading={loading}
                            onClick={onExport}
                            color="blue"
                        >Export</LoadingButton></div>
                    </div>
                </div>


                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    {!dataLoaded ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            <span className="ml-2 text-gray-600">Loading contacts...</span>
                        </div>
                    ) : data && data.data && Array.isArray(data.data) && data.data.length > 0 ? (
                        <ContactTable
                            page={page}
                            refresh={refresh}
                            data={{
                                contacts: data.data.map(contact => ({
                                    ...contact,
                                    // Ensure all required fields are present with proper types
                                    email: contact.email || null,
                                    firstName: contact.firstName || null,
                                    lastName: contact.lastName || null,
                                    additionalInfo: contact.additionalInfo || "[]",
                                    workspaceId: contact.workspaceId || workspaceId,
                                    conversationId: contact.conversationId || null,
                                    createdAt: new Date(contact.createdAt),
                                    updatedAt: new Date(contact.updatedAt)
                                })),
                                counts: data.total
                            }}
                            columns={["", "First Name", "Last Name", "Phone", "Email", "Tag", "Date Added", "Action"]}
                            workspaceId={workspaceId}
                            selectedContacts={selectedContacts}
                            setSelectedContacts={setSelectedContacts}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">You haven&apos;t added any contact yet</h3>
                            <p className="text-gray-500 mb-6 text-center max-w-md mx-auto">Import or add new contacts to populate your contact list</p>
                            <button
                                onClick={() => setAddContact(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Contact
                            </button>
                        </div>
                    )}
                </div>

                <ModalWrapper lg={true} title='Broadcast Message' open={broadcast} handleClose={handleCloseBroadcast}>
                    <TemplatePreprocessor
                        isBroadcast={true}
                        tags={data?.tags || []} selectedContacts={selectedContacts} refresh={refresh} handleClose={handleClose} />
                </ModalWrapper>

                <ModalWrapper title='Add Contact' open={addContact} handleClose={handleCloseContact}>
                    <AddContact refresh={refresh} handClose={handleCloseContact} workspaceId={workspaceId} />
                </ModalWrapper>

                <ModalWrapper lg={true} title='Import Contacts' open={open} handleClose={handleClose}>
                    <ImportContact refresh={refresh} handClose={handleClose} workspaceId={workspaceId} />
                </ModalWrapper>
            </div>
        </DashboardLayout>
    )

}
