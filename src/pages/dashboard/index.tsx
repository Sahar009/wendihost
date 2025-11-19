import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/dashboard/Card'
import LoadingButton from '@/components/utils/LoadingButton'
import { FACEBOOK_CONFIG_ID } from '@/libs/constants'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'
import { useEffect, useState, useCallback, useRef } from 'react'
import Team from '@/components/widgets/team'
import axios, { AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { ApiResponse } from '@/libs/types'
import Contact from '@/components/widgets/contact'
import ServiceMetrics from '@/components/widgets/metrics';
import WhatsappLinkWidget from '@/components/widgets/WhatsappLinkWidget';
import { useSelector, useDispatch } from 'react-redux'
import { getCurrentWorkspace, setCurrentWorkspace } from '@/store/slices/system'
import { useRouter } from 'next/router'

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

interface Metrics {
    contacts: number;
    whatsappLinkClicks: number;
    chatbots: number;
}

export default function Dashboard(props: IProps) {
    console.log('Dashboard component rendered at:', new Date().toISOString());

    const [loggedIn, setLoggedIn] = useState(false)
    const [phoneNumberId, setPhoneNumberId] = useState(null)
    const [wabaId, setWabaId] = useState(null)
    const [accessCode, setAccessCode] = useState(null)
    const [dispNumber, setDispNumber] = useState(null)
    const [isMobile, setIsMobile] = useState(false);
    const [metrics, setMetrics] = useState<Metrics>({ contacts: 0, whatsappLinkClicks: 0, chatbots: 0 });
    
    // Debug: Track metrics state changes with more detail
    const setMetricsWithLog = (newMetrics: Metrics) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] setMetricsWithLog called with:`, newMetrics);
        console.log(`[${timestamp}] Previous metrics state:`, metrics);
        setMetrics(newMetrics);
    };
    const [monthlyClicks, setMonthlyClicks] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFacebookReady, setIsFacebookReady] = useState(false);
    const router = useRouter()
    const dispatch = useDispatch()
    
    // Track component lifecycle
    useEffect(() => {
        console.log('Dashboard component mounted at:', new Date().toISOString());
        return () => {
            console.log('Dashboard component unmounting at:', new Date().toISOString());
        };
    }, []);
    
    useEffect(() => {
        // Check if window is defined (client-side)
        if (typeof window !== 'undefined') {
            const checkIfMobile = () => {
                setIsMobile(window.innerWidth < 768);
            };

            // Initial check
            checkIfMobile();

            // Add event listener for window resize
            window.addEventListener('resize', checkIfMobile);

            // Cleanup
            return () => window.removeEventListener('resize', checkIfMobile);
        }
    }, []);

    const user = JSON.parse(props.user || '{}')

    const workspaceFromStore = useSelector(getCurrentWorkspace)
    const workspace = workspaceFromStore || user?.workspaces?.[0] || null

    const workspaceId = workspace?.id ?? 0
    const workspaceName = workspace?.name ?? ''

    const fbLoginCallback = (response: any) => {
        console.log('Facebook login response:', response);
        
        if (response.authResponse) {
            console.log('Facebook auth successful:', response.authResponse);
            setAccessCode(response.authResponse.code)
        } else if (response.error) {
            console.error('Facebook login error:', response.error);
            toast.error(`Facebook login failed: ${response.error.message || 'Unknown error'}`);
        } else {
            console.log('Facebook login cancelled or no response');
            toast.info('Facebook login was cancelled');
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleFacebookReady = () => {
            if (window.FB && typeof window.FB.login === 'function') {
                setIsFacebookReady(true);
            }
        };

        if (window.FB && typeof window.FB.login === 'function') {
            setIsFacebookReady(true);
        }

        window.addEventListener('facebook-sdk-ready', handleFacebookReady);

        return () => {
            window.removeEventListener('facebook-sdk-ready', handleFacebookReady);
        };
    }, []);

    const launchWhatsAppSignup = () => {
        const facebookAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
        
        console.log('Launching WhatsApp signup with config:', {
            config_id: FACEBOOK_CONFIG_ID,
            app_id: facebookAppId,
            response_type: 'code'
        });
        
        if (!isFacebookReady || !window?.FB || typeof window.FB.login !== 'function') {
            toast.error('Facebook is still initializing. Please try again in a moment.');
            return;
        }
        
        if (!FACEBOOK_CONFIG_ID) {
            toast.error('Facebook configuration is missing. Please check your environment variables.');
            return;
        }
        
        if (!facebookAppId) {
            toast.error('Facebook App ID is missing. Please check your environment variables.');
            return;
        }
        
        const configId = workspace?.facebookConfigId ?? FACEBOOK_CONFIG_ID;

        if (!configId) {
            toast.error('No Facebook configuration found for this workspace.');
            return;
        }

        window?.FB.login(fbLoginCallback, {
            config_id: configId, // configuration ID goes here
            response_type: 'code', // must be set to 'code' for System User access token
            override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
            scope: 'pages_show_list,ads_management,pages_read_engagement', // Add page and ads permissions
            extras: {
                setup: {},
                featureType: '',
                sessionInfoVersion: '2',
            }
        });
    }

    const lastFetchedWorkspaceId = useRef<number | null>(null)

    const fetchDashboardData = useCallback(async (force = false) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] fetchDashboardData called with workspaceId:`, workspaceId);
        console.log(`[${timestamp}] Current workspace name:`, workspaceName);
        console.log(`[${timestamp}] User workspaces:`, user.workspaces);
        
        if (workspaceId && workspaceId > 0) {
            if (!force && lastFetchedWorkspaceId.current === workspaceId) {
                console.log(`[${timestamp}] Skipping fetch - already fetched for workspaceId:`, workspaceId);
                return;
            }

            lastFetchedWorkspaceId.current = workspaceId;
            setIsLoading(true);
            try {
                console.log(`[${timestamp}] Fetching metrics for workspaceId:`, workspaceId);
                const metricsRes = await axios.get(`/api/${workspaceId}/metrics`);
                console.log(`[${timestamp}] Metrics response:`, metricsRes.data);
                console.log(`[${timestamp}] Setting metrics state with:`, metricsRes.data);
                setMetricsWithLog(metricsRes.data);

                try {
                    const clicksRes = await axios.get(`/api/${workspaceId}/metrics-link-clicks`);
                    setMonthlyClicks(clicksRes.data.monthlyClicks || []);
                    console.log(`[${timestamp}] Monthly clicks set successfully`);
                } catch (clicksError) {
                    console.error(`[${timestamp}] Error fetching clicks data:`, clicksError);
                    // Set default empty data for chart instead of failing completely
                    setMonthlyClicks(Array(12).fill(0));
                }
            } catch (error) {
                console.error(`[${timestamp}] Error fetching dashboard data:`, error);
                setMetricsWithLog({ contacts: 0, whatsappLinkClicks: 0, chatbots: 0 });
                setMonthlyClicks([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            console.log(`[${timestamp}] Skipping metrics fetch - invalid workspaceId:`, workspaceId);
        }
    // depend on workspaceId/name so callback updates when workspace changes
    }, [workspaceId, workspaceName]);


    useEffect(() => {
        console.log('useEffect triggered - workspaceId:', workspaceId, 'workspace.name:', workspaceName);
        if (workspaceId && workspaceId > 0 && workspaceName) {
            console.log('Conditions met, fetching dashboard data...');
            fetchDashboardData();
        } else {
            console.log('Conditions not met for fetching dashboard data');
        }
    }, [fetchDashboardData, workspaceId, workspaceName]);

    useEffect(() => {
        if (workspace?.phone) {
            setLoggedIn(true)
        } else {
            setLoggedIn(false)
        }
    }, [workspace?.phone])

    // Debug: Monitor metrics state changes
    useEffect(() => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Metrics state changed:`, metrics);
    }, [metrics])

    useEffect(() => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Workspace changed effect triggered for workspaceId:`, workspaceId);
        setLoggedIn(false);
        setDispNumber(null);
        // Note: We're NOT resetting metrics here to avoid race conditions
    }, [workspaceId]);


    const isAuthenticating = useRef(false)

    useEffect(() => {
        const authenticateBusiness = async () => {
            // Prevent duplicate calls
            if (isAuthenticating.current) {
                console.log('Authentication already in progress, skipping...')
                return
            }

            if (!accessCode || !phoneNumberId || !wabaId) {
                return
            }

            isAuthenticating.current = true
            toast.info("Please wait..., Onboarding in progress")
            try {
                const body = { code: accessCode, phoneNumberId, wabaId }
                const res: AxiosResponse = await axios.post(`/api/${workspaceId}/waba/access-token`, body)
                const data: ApiResponse = res?.data
                toast.success(data.message)
                
                // Update workspace in Redux with the new connection data
                if (data?.data?.workspace) {
                    dispatch(setCurrentWorkspace(data.data.workspace))
                } else if (workspace) {
                    // Fallback: update existing workspace with new phone and access token
                    dispatch(setCurrentWorkspace({
                        ...workspace,
                        phone: data?.data?.phone || workspace.phone,
                        accessToken: data?.data?.workspace?.accessToken || workspace.accessToken,
                        phoneId: data?.data?.workspace?.phoneId || workspace.phoneId,
                        whatsappId: data?.data?.workspace?.whatsappId || workspace.whatsappId,
                        businessId: data?.data?.workspace?.businessId || workspace.businessId,
                    }))
                }
                
                setLoggedIn(true)
                setDispNumber(data?.data?.phone)
                await fetchDashboardData(true)
            } catch (e) {
                toast.error((e as any)?.response?.data?.message)
            } finally {
                setAccessCode(null)
                setPhoneNumberId(null)
                setWabaId(null)
                isAuthenticating.current = false
            }
        }
        
        authenticateBusiness()
    }, [accessCode, phoneNumberId, wabaId, workspaceId])


    useEffect(() => {
        window.addEventListener('message', (event) => {
            if (event.origin !== "https://web.facebook.com" && event.origin !== "https://www.facebook.com") return;
            try {
                const data = JSON.parse(event.data);
                if (data?.type === 'WA_EMBEDDED_SIGNUP') {
                    setPhoneNumberId(data?.data?.phone_number_id)
                    setWabaId(data?.data?.waba_id)
                }
            } catch {

            }
        });
    }, [])

    return (
        <DashboardLayout user={user}>

            <div className="space-y-6" key={workspaceId}>
                {isLoading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                <p className="text-blue-800 text-sm font-medium">
                                    Refreshing data for workspace: {workspace?.name}
                                </p>
                            </div>

                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <span className="text-sm text-gray-500">Total contacts</span>
                        <span className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                            ) : (
                                metrics.contacts
                            )}
                        </span>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <span className="text-sm text-gray-500">Whatsapp link clicks</span>
                        <span className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                            ) : (
                                metrics.whatsappLinkClicks
                            )}
                        </span>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
                        <span className="text-sm text-gray-500">Chat bots</span>
                        <span className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                            ) : (
                                metrics.chatbots
                            )}
                        </span>
                    </div>
                </div>

              
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <div className='md:col-span-2'>

                     

                        {
                            (workspace?.phone && workspace?.accessToken) ?

                                <div>
                                    <div className="items-center w-full md:w-[50%] bg-blue-100 shadow-xl rounded-lg p-4 flex justify-between">
                                        <p className='text-lg font-semibold text-blue-500'>Send broadcast messages to your contacts</p>
                                        <div className='w-56'>
                                            <LoadingButton onClick={() => router.push('/dashboard/contacts')} color='blue'>Create Broadcast</LoadingButton>
                                        </div>
                                    </div>
                                    <div className='flex justify-between p-4'>
                                        <p>Your Whatsapp phone number is {workspace?.phone || dispNumber}</p>
                                    </div>
                                </div>
                                :
                                <div className=' items-center w-full md:w-[50%] sm:w-full bg-green-500 shadow-xl rounded-lg p-4'>

                                    <div className='flex justify-between items-center '>
                                        <p className='text-lg font-semibold text-white'>Link your WhatsApp Business</p>
                                        <div className='w-56'>
                                            <LoadingButton onClick={launchWhatsAppSignup} color='green' disabled={!isFacebookReady}>Connect Account</LoadingButton>
                                        </div>
                                    </div>

                                </div>
                        }


                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ServiceMetrics isMobile={isMobile} monthlyClicks={monthlyClicks} />
                    <WhatsappLinkWidget />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <Contact />
                    </div>
                    <div>
                        <Team />
                    </div>
                </div>

                {/* <div className='h-[600px]'>
                    <Card>
                        <h3 className='font-semibold'>Template Messages </h3>
                        <hr className='mt-6'></hr>
                    </Card>
                </div>

                <div className='h-[600px]'>
                    <Card>
                        <h3 className='font-semibold'>Message Snippets </h3>
                        <hr className='mt-6'></hr>
                    </Card>
                </div> */}

            </div>

        </DashboardLayout>
    )

}

