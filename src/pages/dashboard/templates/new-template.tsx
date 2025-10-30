import Input from '@/components/auth/Input'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ChatPreview from '@/components/utils/ChatPreview'
import LoadingButton from '@/components/utils/LoadingButton'
import Select from '@/components/utils/Select'
import Textarea from '@/components/utils/Textarea'
import useInput from '@/hooks/useInput'
import { TEMPLATE_CATEGORY } from '@/libs/constants'
import { DASHBOARD_ROUTES } from '@/libs/enums'
import { MESSAGE_BUTTON, MESSAGE_COMPONENT } from '@/libs/interfaces'
import { ChatLanguageType } from '@/libs/types'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import axios from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import EmojiPicker from 'emoji-picker-react';
import TemplateHeader from '@/components/dashboard/template/TemplateHeader'
import TemplateFooter from '@/components/dashboard/template/TemplateFooter'
import AddVariable from '@/components/dashboard/template/AddVariableBtn'
import TemplatePlaceholder from '@/components/dashboard/template/TemplatePlaceholder'
import { getCurrentWorkspace } from '@/store/slices/system'
import { useSelector } from 'react-redux'


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

    const [header, setHeader] = useState<MESSAGE_COMPONENT>()
    const [footer, setFooter] = useState<MESSAGE_COMPONENT>()
    const [button, setButton] = useState<MESSAGE_COMPONENT>()

    const [headerParams, setHeaderParams] = useState<string[]>([])
    const [bodyParams, setBodyParams] = useState<string[]>([])

    const [isValidHeader, setIsValidHeader] = useState(false)
    const [isValidFooter, setIsValidFooter] = useState(false)
    const [isValidBtn, setIsValidBtn] = useState(false)

    const router = useRouter()


    const [components, setComponents] = useState<MESSAGE_COMPONENT[]>([])

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const name = useInput("slug", 2)
    const message = useInput("text", 10)

    const [category, setCategory] = useState<string>(TEMPLATE_CATEGORY[0].value)
    const [language, setLanguage] = useState<ChatLanguageType>("en_US")

    const isDisabled = false // name.error || message.error //|| !isValidHeader || !isValidFooter //|| !isValidBtn

    const [loading, setLoading] = useState(false)


    useEffect(() => {

        const components : MESSAGE_COMPONENT[] = []

        // Only include header if it has valid text content
        if (header && header.text && (header.text as string).trim().length > 0) {
            if (headerParams.length > 0) {
                components.push({...header, example: { body_text: bodyParams }})
            } else {
                components.push(header)
            }
        }

        if (bodyParams.length > 0) {
            components.push({
                type: "BODY", 
                text: message.value as string, 
                example: { body_text: bodyParams }
            })
        } else {
            components.push({type: "BODY", text: message.value as string})
        }

        if (footer && footer?.text && footer?.text?.trim()?.length > 0) components.push(footer)

        if ((button?.buttons as MESSAGE_BUTTON[])?.length > 0) components.push(button as MESSAGE_COMPONENT)

        setComponents(components)

    }, [message.value, header, footer, button, bodyParams, headerParams])

    useEffect(() => {
        if (header) {
            switch (header.format) {
                case "TEXT":
                    if ((header.text as string)?.length > 3) setIsValidHeader(true)
                    else setIsValidHeader(false)
                    break
                default:
                    setIsValidHeader(true)
            }
            
        } else {
            setIsValidHeader(true)
        }
    }, [header])

    useEffect(() => {
        if (footer && (footer.text as string).length > 3) {
            setIsValidFooter(true)
        } else if (footer) {
            setIsValidFooter(false)
        } else {
            setIsValidFooter(true)
        }
    }, [footer])

    useEffect(() => {
        if (button && (button.buttons as MESSAGE_BUTTON[]).length > 0) {
            setIsValidBtn(true)
        } else {
            setIsValidBtn(false)
        }
    }, [button])

    const buildTemplate = () => {
        return components.map(component => {
            if (component.type === "BODY" || component.type === "HEADER") {
                return { ...component, text: buildTemplateText(component.text) }
            } 
            return component
        })
    }

    const buildTemplateText = (text: string | undefined) : string => {
        if (!text) return ""
        let output = ""
        let index = 0

        for (let i = 0; i < text.length; i++) {
            if (i + 3 < text.length && text[i] === "{" && text[i + 1] === "{" && text[i + 2] === "}" && text[i + 3] === "}") {
                output += "{{" + ++index + "}}"
                i += 3 // Skip the next 3 characters since we're already at the first {
            } else {
                output += text[i]
            }
        }
        return output
    }

    useEffect(() => {
        const text = buildTemplateText(message.value as string)
        console.log({text})
    }, [message.value, header, footer, button])


    const onSubmit = async () => {

        setLoading(true)

        const realComponents = buildTemplate()
        
      

        try {

            const body = {  name: name.value, language, category, components: realComponents  }

            const res = await axios.post(`/api/${workspaceId}/template/create`, body)

            toast.success(res.data.message)

            router.push(DASHBOARD_ROUTES.TEMPLATES)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                const errorMessage = e?.response?.data?.message
                
                // Handle specific template validation errors
                if (errorMessage?.includes('HEADER is missing expected field(s) (text)')) {
                    toast.error('Header component requires text content. Please add text to your header or remove the header section.')
                } else if (errorMessage?.includes('Meta Business setup')) {
                    toast.error(errorMessage)
                    toast.info('Redirecting to dashboard to complete setup...', {
                        onClose: () => router.push('/dashboard')
                    })
                    // Redirect after a short delay
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 2000)
                } else {
                    toast.error(errorMessage || 'Failed to create template')
                }
            } else {
                console.error(e);
                toast.error('An unexpected error occurred')
            }

        }

        setLoading(false)

    }


    return (
        <DashboardLayout user={user}>

            <div className='grid grid-cols-1 lg:grid-cols-2'>

                <div className='max-h-[calc(100vh_-_80px)] px-5 overflow-y-auto'>

                    <Input 
                        label='Template Name' placeholder='e.g welcome_back'
                        value={name.value} id="name" name='name' type='text'
                        helperText={name.errorMessage}  error={name.errorWarning}
                        onChange={(e) => name.setValue(e.target.value)} 
                        onFocus={() => name.setOnFocus(true)} />

                    <Select name='category' label='Category' id="category" lists={TEMPLATE_CATEGORY} onChange={setCategory} />

                    <TemplateHeader setHeader={setHeader} />

                    <TemplatePlaceholder 
                        text={String(header?.text)} 
                        params={headerParams} 
                        setParams={setHeaderParams} />

                    <hr />

                    <Textarea 
                        label='Message' name='message' id='message' placeholder='Type your message here' 
                        helperText={message.errorMessage} value={message.value}
                        onChange={(value) => message.setValue(value)} 
                        error={message.errorWarning}
                        onFocus={() => message.setOnFocus(true)} />

                    <div className="flex justify-end">

                        <AddVariable value={message.value as string} setValue={message.setValue} />

                    </div>

                    <TemplatePlaceholder 
                        text={String(message.value)} 
                        params={bodyParams} 
                        setParams={setBodyParams} />

                    <hr />

                    <TemplateFooter setFooter={setFooter} />

                    <div>
                        <LoadingButton disabled={isDisabled} loading={loading} onClick={onSubmit}>Submit</LoadingButton>
                    </div>

                </div>

                <div className='flex justify-center'>
                    <ChatPreview components={components} />
                </div>

            </div>

        </DashboardLayout>
    )

}