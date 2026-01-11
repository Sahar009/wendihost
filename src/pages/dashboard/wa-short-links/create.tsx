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

export default function CreateTemplate(props: IProps) {

    const user = JSON.parse(props.user)

    const [phone, setPhone] = useState()

    const router = useRouter()

    const [components, setComponents] = useState<MESSAGE_COMPONENT[]>([])

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const name = useInput("slug", 2)
    const message = useInput("text", 10)

    const isDisabled = name.error ||  message.error || !phone

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

            const body = {  name: name.value, message: message.value, phoneNumber: phone }

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

            <div className='grid grid-cols-1 lg:grid-cols-2'>

                <div className='max-h-[calc(100vh_-_80px)] px-5 overflow-y-auto'>

                    <h2 className='text-2xl'> Generate Your WhatsApp Link</h2>

                    <label className='block text-gray-950 font-bold my-2 text-lg'> Type your WhatsApp phone number </label>
                    
                    <PhoneNumber hideLabel={true} phone={phone} onChange={setPhone} placeholder="Enter user's WhatsApp number" />     

                    <div className='mt-4'>

                        <label htmlFor='textarea' className='block text-gray-950 font-bold my-2 text-lg'> WhatsApp Message </label>

                        <div className="relative">
                            <Textarea 
                                label='Message' name='message' id='message' placeholder='Type your message here' 
                                helperText={message.errorMessage} value={message.value}
                                onChange={(value) => message.setValue(value)}
                                error={message.errorWarning}
                                onFocus={() => message.setOnFocus(true)} hideLabel={true} />  

                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Toggle emoji picker"
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        </div>

                        {showEmojiPicker && (
                            <div className="mt-2 border border-gray-200 rounded-lg shadow-lg">
                                <EmojiPicker 
                                    width={'100%'} 
                                    onEmojiClick={(e) => {
                                        console.log(e)
                                        message.setValue(value => value + e.emoji)
                                    }} />
                            </div>
                        )}

                    </div>

                    <div className='mt-4'>

                        <label htmlFor='textarea' className='block text-gray-950 font-bold my-4 text-lg'> Branded Link </label>

                        <p> Branded links allow you to use more customized links like wendi.app/
                            <span className='text-green-600'>{String(name.value).length > 1 ? name.value : "YourBusinessName"}</span> 
                        </p>

                        <Input 
                            id='textarea' 
                            name='name'
                            type='text'
                            placeholder='Your Business name' 
                            onChange={(e) => name.setValue(e.target.value)}
                            value={name.value}
                            onFocus={() => name.setOnFocus(true)}
                            error={name.errorWarning}
                            helperText={name.errorMessage}
                            />    

                    </div>


                    <div className='flex justify-between mt-4'>

                        <LoadingButton onClick={onSubmit} loading={loading} disabled={isDisabled}> Generate Whatsapp Link </LoadingButton>

                    </div>

                </div>

                <div className='flex items-center justify-center'>
                    <ChatPreview components={components} />
                </div>

            </div>

        </DashboardLayout>
    )

}