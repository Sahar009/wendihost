import DashboardLayout from '@/components/dashboard/DashboardLayout'
import TemplateTab from '@/components/dashboard/TemplateTab'
import TemplateTable from '@/components/dashboard/tables/templateTable'
import ChatPreview from '@/components/utils/ChatPreview'
import LoadingButton from '@/components/utils/LoadingButton'
import LoadingButtonSM from '@/components/utils/LoadingButtonSM'
import { DASHBOARD_ROUTES } from '@/libs/enums'
import { MESSAGE_COMPONENT, MESSAGE_TEMPLATE } from '@/libs/interfaces'
import { ApiResponse } from '@/libs/types'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { getCurrentWorkspace } from '@/store/slices/system'
import axios, { AxiosResponse } from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import useSWR, { mutate } from 'swr'


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

export default function Template(props: IProps) {

    const user = JSON.parse(props.user)

    const [data, setData] = useState([])

    const [preview, setPreview] = useState<MESSAGE_COMPONENT[] | null>(null)

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getData = useSWR(`/api/${workspaceId}/template/get?page=${1}`, axios)

    const router = useRouter()

    useEffect(() => {
        
        const res = getData?.data as AxiosResponse

        const data : ApiResponse = res?.data

        if (data?.data) {

            data?.data?.map((temp: any, index: number) => {
                temp.components = eval(temp.components as any)
                return  {...temp}
            })

            setData(data?.data)
        }

    }, [getData])

    const refresh = () => {
        mutate(`/api/${workspaceId}/template/get?page=${1}`);
    };

    // const sync = async () => {

    //     setLoading(true)

    //     try {
    //         await axios.post(`/api/${workspaceId}/template/sync`, {})

    //         toast.success("Synchronize")

    //         refresh()

    //     } catch (e) {

    //         if (axios.isAxiosError(e)) {
    //             toast.error(e?.response?.data?.message)
    //         } else {
    //             console.error(e);
    //         }

    //     }

    //     setLoading(false)
        
    // }

    return (
        <DashboardLayout user={user}>

            <TemplateTab index={0} />

            <div className='mt-4 flex justify-end gap-4'>
                <div className='w-48'><LoadingButton onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATE_BUILDER)}>Submit Template</LoadingButton></div>
                {/* <div className='w-24 mt-2'><LoadingButtonSM loading={loading} onClick={sync} color='green'>Sync</LoadingButtonSM></div> */}
            </div>

            <div className='grid grid-cols-1 gap-y-10 lg:grid-cols-3'>

                <div className='col-span-2'>

                    {
                        data && data.length > 0 ? (
                            <TemplateTable  
                                columns={["Name", "Topic", "Message", "Date Added", "Action"]} 
                                data={data} 
                                workspaceId={workspaceId} 
                                setPreview={setPreview} 
                                refresh={refresh} 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <svg 
                                    className="mx-auto h-12 w-12 text-blue-500" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1} 
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATE_BUILDER)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        New Template
                                    </button>
                                </div>
                            </div>
                        )
                    }
                    </div>

                <div className='flex justify-center'>
                    <ChatPreview components={preview} /> 
                </div>

            </div>


        </DashboardLayout>
    )

}