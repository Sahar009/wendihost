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

    try {
        const user = await validateUser(req)

        const data = user as any

        if (data?.redirect) return sessionRedirects(data?.redirect)
        
        return { 
          props: {
            user: JSON.stringify(user || {}),
          }, 
        }
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return sessionRedirects('/auth/login');
    }
    
}, sessionCookie())


interface IProps {
    user: string;
}

export default function Template(props: IProps) {

    let user;
    try {
        user = JSON.parse(props.user || '{}');
    } catch (error) {
        console.error('Error parsing user data:', error);
        user = {};
    }

    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<MESSAGE_COMPONENT[] | null>(null)

    const workspace = useSelector(getCurrentWorkspace)
    const workspaceId = workspace?.id

    const getData = useSWR(workspaceId ? `/api/${workspaceId}/template/get?page=${1}` : null, axios)

    const router = useRouter()

    useEffect(() => {
        if (!workspaceId) {
            setData([]);
            return;
        }
        
        if (getData.error) {
            console.error('Error fetching templates:', getData.error);
            toast.error('Failed to fetch templates. Please check your connection.');
            setData([]);
            return;
        }
        
        const res = getData?.data as AxiosResponse

        if (!res) {
            console.log('Loading templates...');
            return;
        }

        try {
            const data : ApiResponse = res?.data

            console.log('Template API response:', {
                status: data?.status,
                dataLength: data?.data?.length,
                message: data?.message
            });
            
            console.log('Template names from API:', data?.data?.map((t: any) => t.name) || []);

            if (data?.data && Array.isArray(data.data)) {
                console.log(`Processing ${data.data.length} templates for display`);
                console.log('Raw template data sample:', data.data[0] ? {
                    id: data.data[0].id,
                    name: data.data[0].name,
                    status: data.data[0].status,
                    componentsType: typeof data.data[0].components,
                    isComponentsArray: Array.isArray(data.data[0].components)
                } : 'No templates');

                const processedTemplates = data.data.map((temp: any, index: number) => {
                    try {
                        // Handle components - could be string, array, or already parsed
                        if (typeof temp.components === 'string') {
                            temp.components = JSON.parse(temp.components);
                        } else if (!Array.isArray(temp.components)) {
                            temp.components = [];
                        }
                    } catch (e) {
                        console.warn(`Error parsing components for template ${temp.name}:`, e);
                        temp.components = [];
                    }
                    return { ...temp };
                });

                // Only update if data actually changed to prevent infinite loops
                setData(prevData => {
                    const prevIds = prevData.map(t => t.id).sort().join(',');
                    const newIds = processedTemplates.map(t => t.id).sort().join(',');
                    if (prevIds !== newIds || prevData.length !== processedTemplates.length) {
                        console.log(`Setting ${processedTemplates.length} templates to state`);
                        return processedTemplates;
                    }
                    return prevData;
                });
            } else {
                console.log('No templates in response or invalid format');
                setData([]);
            }
        } catch (error) {
            console.error('Error processing template data:', error);
            toast.error('Error processing template data');
            setData([]);
        }

    }, [getData?.data, getData?.error, workspaceId]) // Include error in dependencies

    const refresh = () => {
        if (workspaceId) {
            mutate(`/api/${workspaceId}/template/get?page=${1}`);
        }
    };

    const sync = async () => {
        if (!workspaceId) {
            toast.error('Please select a workspace first');
            return;
        }

        setLoading(true)

        try {
            const response = await axios.post(`/api/${workspaceId}/template/sync`, {})
            
            if (response.data?.status === 'success') {
                toast.success(response.data?.message || "Templates synced successfully")
                refresh()
            } else {
                toast.error(response.data?.message || "Failed to sync templates")
            }

        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message || "Failed to sync templates from Facebook")
            } else {
                console.error(e);
                toast.error("An error occurred while syncing templates")
            }
        }

        setLoading(false)
    }

    // Safety check - don't render if user is invalid
    if (!user || typeof user !== 'object' || Object.keys(user).length === 0) {
        return null;
    }

    return (
        <DashboardLayout user={user}>

            <TemplateTab index={0} />

            <div className='mt-4 flex justify-between items-center gap-4 flex-wrap'>
                <div className='flex gap-2'>
                    <LoadingButtonSM onClick={sync} loading={loading} disabled={!workspaceId}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync from Meta
                    </LoadingButtonSM>
                </div>
                <div className='w-48'><LoadingButton onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATE_BUILDER)}>Submit Template</LoadingButton></div>
            </div>

            <div className='grid grid-cols-1 gap-y-10 lg:grid-cols-3'>

                <div className='col-span-2'>

                    {
                        !workspaceId ? (
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
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No workspace selected</h3>
                                <p className="mt-1 text-sm text-gray-500">Please select a workspace to view templates.</p>
                            </div>
                        ) : data && data.length > 0 ? (
                            <TemplateTable  
                                columns={["Name", "Topic", "Message", "Date Added", "Action"]} 
                                data={data} 
                                workspaceId={workspaceId} 
                                setPreview={setPreview} 
                                refresh={refresh} 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-20 w-20 rounded-full bg-blue-100 opacity-50"></div>
                                    </div>
                                    <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-blue-50">
                                        <svg 
                                            className="h-10 w-10 text-blue-600" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mt-6 text-lg font-semibold text-gray-900">No templates yet</h3>
                                <p className="mt-2 text-sm text-gray-600 max-w-sm">Get started by creating your first WhatsApp message template to streamline your communications.</p>
                                <div className="mt-8">
                                    <button
                                        type="button"
                                        onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATE_BUILDER)}
                                        className="inline-flex items-center gap-2 px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl hover:scale-105"
                                    >
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Create New Template
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