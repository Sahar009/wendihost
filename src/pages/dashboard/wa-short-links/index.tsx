import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AddContact from '@/components/dashboard/contacts/AddContact'
import ImportContact from '@/components/dashboard/contacts/ImportContact'
import ContactTable from '@/components/dashboard/tables/contactTables'
import WaLinkTable from '@/components/dashboard/tables/waLinkTables'
import LoadingButton from '@/components/utils/LoadingButton'
import ModalWrapper from '@/components/utils/ModalWrapper'
import { DASHBOARD_ROUTES } from '@/libs/enums'
import { ApiResponse } from '@/libs/types'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { getCurrentWorkspace } from '@/store/slices/system'
import axios, { AxiosResponse } from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import useSWR, { mutate } from 'swr'
import Image from 'next/image'




export const getServerSideProps = withIronSessionSsr(async({req, res}) => {

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

export default function ShortLinks(props: IProps) {

    const router = useRouter()

    const [page, setPage] = useState(0)

    const [loading, setLoading] = useState(false)

    const [data, setData] = useState([])

    const [search, setSearch] = useState('')
    
    // Filter data based on search
    const filteredData = data?.filter((item: any) => {
        const searchLower = search.toLowerCase();
        return (
            item?.name?.toLowerCase().includes(searchLower) ||
            item?.phoneNumber?.toString().includes(searchLower)
        );
    }) || [];

    const user = JSON.parse(props.user)

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getData = useSWR(`/api/${workspaceId}/wa-link/get?page=${page}`, axios)

    useEffect(() => {
        
        const res = getData?.data as AxiosResponse
        const data : ApiResponse = res?.data

        if (data?.data) {
            setData(data?.data)
        }

    }, [getData])

    useEffect(() => {
        const page = router.query.page
        setPage(page ? Number(page) : 1) 
    }, [getData, router.query.page, router])

    const refresh = () => {
        mutate(`/api/${workspaceId}/wa-link/get?page=${page}`)
    }


    return (
        <DashboardLayout user={user}>
            <div className='my-6 flex justify-between items-center gap-4'>
                <div className='flex items-center gap-4 flex-1'>
                    <div className='relative flex-1 max-w-md'>
                        
                        <input
                            type='text'
                            placeholder='Search short links...'
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm'
                        />
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                   
                    <LoadingButton loading={loading} onClick={() => router.push(DASHBOARD_ROUTES.SHORTS + '/create')} color='blue' className='px-4'>
                        
                       + Create Short Link 
                    </LoadingButton>
                </div>
            </div>

           
            {filteredData.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-[60vh]'>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <Image src="/images/link%20icon.png" alt="Short link icon" width={120} height={120} className="relative" />
                    </div>
                    <div className='mt-6 text-lg font-medium text-gray-700'>No Short Links Found</div>
                    <p className='mt-2 text-sm text-gray-500 text-center max-w-md'>
                        Create your first short link to start sharing your WhatsApp contact with QR codes
                    </p>
                    <button
                        className='mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2'
                        onClick={() => router.push(DASHBOARD_ROUTES.SHORTS + '/create')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Short Link
                    </button>
                </div>
            ) : (
                <WaLinkTable
                    page={page}
                    refresh={refresh}
                    data={filteredData as any}
                    columns={["Name", "Phone", "Visitors", "Message", "Link", "Date Added", ""]}
                    workspaceId={workspaceId}
                />
            )}
        </DashboardLayout>
    )
}
