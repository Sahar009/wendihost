import Input from '@/components/auth/Input'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ChatPreview from '@/components/utils/ChatPreview'
import LoadingButton from '@/components/utils/LoadingButton'
import PhoneNumber from '@/components/utils/PhoneNumber'
import Textarea from '@/components/utils/Textarea'
import useInput from '@/hooks/useInput'
import { DASHBOARD_ROUTES } from '@/libs/enums'
import { MESSAGE_COMPONENT } from '@/libs/interfaces'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import axios from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import 'react-phone-number-input/style.css'
import EmojiPicker from 'emoji-picker-react';
import { getCurrentWorkspace } from '@/store/slices/system'
import { useSelector } from 'react-redux'
import { Smile } from 'lucide-react'

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

export default function CreateTemplate(props: IProps) {

    const user = JSON.parse(props.user)

    const [phone, setPhone] = useState()

    const router = useRouter()

    const [components, setComponents] = useState<MESSAGE_COMPONENT[]>([])

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const name = useInput("slug", 2)
    const message = useInput("text", 10)

    const isDisabled = name.error || message.error || !phone

    const [loading, setLoading] = useState(false)

    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    useEffect(() => {
        setComponents([
            {
                type: "BODY",
                format: "TEXT",
                text: String(message.value)
            }
        ])
    }, [message.value])


    const onSubmit = async () => {

        setLoading(true)

        try {

            const body = { name: name.value, message: message.value, phoneNumber: phone }

            const res = await axios.post(`/api/${workspaceId}/wa-link/create`, body)

            toast.success(res.data.message)

            router.push(DASHBOARD_ROUTES.SHORTS)

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
            <div className='max-w-7xl mx-auto'>
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900'>Create WhatsApp Link</h1>
                    <p className='text-gray-500 mt-2 text-lg'>Generate a custom WhatsApp link with a pre-filled message for your business</p>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                    {/* Form Section */}
                    <div className='lg:col-span-7 space-y-6'>

                        {/* Step 1: Phone Number */}
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md'>
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg'>1</div>
                                <h2 className='text-xl font-bold text-gray-900'>Connect Your Number</h2>
                            </div>

                            <div className='pl-14'>
                                <label className='block text-gray-700 font-medium mb-3'>WhatsApp Phone Number</label>
                                <PhoneNumber
                                    hideLabel={true}
                                    phone={phone}
                                    onChange={setPhone}
                                    placeholder="Enter your WhatsApp number"
                                    helperText="This number will receive the messages sent via your link"
                                />
                            </div>
                        </div>

                        {/* Step 2: Message */}
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md'>
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg'>2</div>
                                <h2 className='text-xl font-bold text-gray-900'>Draft Your Message</h2>
                            </div>

                            <div className='pl-14'>
                                <label className='block text-gray-700 font-medium mb-3'>Pre-filled Message</label>
                                <div className="relative group">
                                    <Textarea
                                        label='Message' name='message' id='message' placeholder='Hi! I would like to know more about...'
                                        helperText={message.errorMessage || "This message will appear in the user's chat box automatically"}
                                        value={message.value}
                                        onChange={(value) => message.setValue(value)}
                                        error={message.errorWarning}
                                        onFocus={() => message.setOnFocus(true)}
                                        hideLabel={true}
                                        className="!h-32 !text-base !p-4 !rounded-xl transition-all border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${showEmojiPicker ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                        title="Add emoji"
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>
                                </div>

                                {showEmojiPicker && (
                                    <div className="mt-3 relative z-10 animate-fadeIn">
                                        <div className="absolute inset-0 bg-transparent" onClick={() => setShowEmojiPicker(false)}></div>
                                        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-gray-100">
                                            <EmojiPicker
                                                width={'100%'}
                                                onEmojiClick={(e) => {
                                                    message.setValue(value => value + e.emoji)
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Branded Link */}
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md'>
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg'>3</div>
                                <h2 className='text-xl font-bold text-gray-900'>Brand Your Link</h2>
                            </div>

                            <div className='pl-14'>
                                <label className='block text-gray-700 font-medium mb-3'>Custom Link Slug</label>

                                <div className='mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2 text-gray-600 font-mono text-sm overflow-x-auto'>
                                    <span className="shrink-0">Preview:</span>
                                    <span className="text-gray-400">wendi.app/</span>
                                    <span className='text-purple-600 font-semibold'>{String(name.value).length > 0 ? name.value : "your-business"}</span>
                                </div>

                                <Input
                                    id='slug'
                                    name='name'
                                    type='text'
                                    placeholder='e.g. mikes-pizza'
                                    onChange={(e) => name.setValue(e.target.value)}
                                    value={name.value}
                                    onFocus={() => name.setOnFocus(true)}
                                    error={name.errorWarning}
                                    helperText={name.errorMessage || "Use only letters, numbers, and hyphens"}
                                // className="!h-14 !text-lg !rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className='flex justify-end pt-4 pb-12'>
                            <div className="w-full md:w-auto">
                                <LoadingButton
                                    onClick={onSubmit}
                                    loading={loading}
                                    disabled={isDisabled}
                                    className="!text-lg !font-bold !rounded-xl !px-8 !py-4 w-full shadow-lg shadow-green-200 hover:shadow-green-300 transition-all transform hover:-translate-y-0.5"
                                    color="green"
                                >
                                    Generate WhatsApp Link
                                </LoadingButton>
                            </div>
                        </div>

                    </div>

                    {/* Preview Section */}
                    <div className='lg:col-span-5'>
                        <div className='sticky top-6'>
                            <div className='bg-gray-50 rounded-3xl p-6 border border-gray-200'>
                                <h3 className='text-lg font-semibold text-gray-700 mb-6 text-center'>Live Preview</h3>
                                <div className='flex items-center justify-center transform scale-90 sm:scale-100 transition-transform origin-top'>
                                    <ChatPreview components={components} />


                                </div>
                                <p className='text-center text-gray-400 text-sm mt-8'>This is how your message will appear to customers</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    )

}