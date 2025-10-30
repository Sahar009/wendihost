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
            <div className='my-4 flex justify-between items-center gap-4'>
                {/* Search Bar */}
                <div className='w-64'>
                    <input
                        type='text'
                        placeholder='Search'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className='w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50'
                    />
                </div>
                <div className='w-44'>
                    <LoadingButton loading={loading} onClick={() => router.push(DASHBOARD_ROUTES.SHORTS + '/create')} color='blue'>
                        + Create Short Link
                    </LoadingButton>
                </div>
            </div>

           
            {filteredData.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-[60vh]'>
                    <Image src="/images/link%20icon.png" alt="Short link icon" width={120} height={120} />
                    <div className='mt-6 text-lg font-medium text-gray-700'>No Short Link Found</div>
                    <button
                        className='mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition'
                        onClick={() => router.push(DASHBOARD_ROUTES.SHORTS + '/create')}
                    >
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
