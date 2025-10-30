import LoadingButton from "@/components/utils/LoadingButton"
import { MESSAGE_COMPONENT, MESSAGE_TEMPLATE } from "@/libs/interfaces"
import { ApiResponse } from "@/libs/types"
import axios, { AxiosResponse } from "axios"
import { useEffect, useMemo, useState } from "react"
import useSWR from 'swr'
import { toast } from "react-toastify"
import Select from "@/components/utils/Select"
import LoadingContainer from "@/components/utils/LoadingContainer"
import { useRouter } from "next/router"
import TemplateVariables, { ITemplateParameter, TemplateParams } from "./TemplateVariables"
import { Conversation } from "@prisma/client"
import { addMessage } from "@/store/slices/messageSlice"
import { useDispatch, useSelector } from "react-redux"
import { getCurrentWorkspace } from "@/store/slices/system"


interface IProps {
    isBroadcast: boolean;
    tags: { tag: string }[];
    selectedContacts?: number[];
    conversation?: Conversation;
    refresh(): void
    handleClose(): void
}

export type BroadcastParams = {
    isRaw: boolean;
    value: string;
    column: string;
}

export interface IBroadcastParams {
    headers: BroadcastParams[]
    body: BroadcastParams[]
}

const TemplatePreprocessor = (props: IProps) => {

    const { conversation, isBroadcast, selectedContacts, refresh, handleClose } = props

    const dispatch = useDispatch()

    const { id: workspaceId } = useSelector(getCurrentWorkspace)
    const router = useRouter()

    const getTemplates = useSWR(`/api/${workspaceId}/template/get?page=${1}&status=APPROVED`, axios)

    const tags = useMemo(() => {
        return [{name: "All", value: "all"}, ...props.tags.map((tag) => ({ name: tag.tag.charAt(0).toUpperCase() + tag.tag.slice(1), value: tag.tag }))]
    }, [props.tags])

    const [loading, setLoading] = useState(false)
    const [templateIndex, setTemplateIndex] = useState(-1)
    const [templates, setTemplates] = useState<MESSAGE_TEMPLATE[]>([])
    const [tag, setTag] = useState("all")
    const [templateText, setTemplateText] = useState({header: "", body: ""})
    const [params, setParams] = useState<{headerParams: TemplateParams[], bodyParams: TemplateParams[]}>({headerParams: [], bodyParams: []})

    useEffect(() => {
        const res = getTemplates?.data as AxiosResponse
        const data : ApiResponse = res?.data
        
        if (data?.data?.length > 0) {
            setTemplates(data?.data)
        }
    }, [getTemplates])


    useEffect(() => {
        if (templateIndex < 0) return
        const template = templates[templateIndex]
        let header = ""
        let body = ""
        template.components.forEach((component) => {
            if (component.type === "BODY") body = component.text ?? ""
            if (component.type === "HEADER") header = component.text ?? ""
            return ""
        })
        setTemplateText({header, body})
    }, [templateIndex, templates])

    const onSubmit = async () => {

        if (templateIndex < 0) return

        setLoading(true)

        const template : MESSAGE_TEMPLATE = { ...templates[templateIndex] }

        const parameters = templates[templateIndex].components.map((component) => {
            if (component.type === "BODY" && params.bodyParams.length > 0) return { type: "body", parameters: params.bodyParams }
            if (component.type === "HEADER" && params.headerParams.length > 0) return { type: "header", parameters: params.headerParams }
            return null
        }).filter((param) => param !== null) as ITemplateParameter[]

        if (isBroadcast) {
            await broadcastTemplate(template as MESSAGE_TEMPLATE, parameters)
        } else {
            await sendTemplate(template as MESSAGE_TEMPLATE, parameters)
        }

        setLoading(false)

    }

    const sendTemplate = async (template: MESSAGE_TEMPLATE, parameters: ITemplateParameter[]) => {

        if (templateIndex < 0 || !conversation) return

        const body = { 
            chatId: conversation?.id, 
            templateId: template.id, 
            templateName: template.name, 
            templateComponent: JSON.stringify(template.components),
            parameters,
        } 

        try {
            const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chats/${conversation.phone}/message-template`, body)

            const data : ApiResponse = res?.data

            dispatch(addMessage(data?.data))

            handleClose()

        } catch (e) {
            
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

    }

    const broadcastTemplate = async (template: MESSAGE_TEMPLATE, parameters: ITemplateParameter[]) => {

        try {

            const body = {  
                toAll: tag === "all",
                selectedContacts: props.selectedContacts,
                templateId: template.id, 
                templateName: template.name, 
                templateComponent: JSON.stringify(template.components) ,
                tag,
                parameters
            }

            const res = await axios.post(`/api/${workspaceId}/broadcast/send`, body)

            toast.success(res.data.message)

            handleClose()

            refresh()
            
        } catch (e) {
            
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        } 

    }

    if (getTemplates?.isLoading) return (<LoadingContainer />)

    if (!getTemplates?.isLoading && templates.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-lg shadow">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">No templates found</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">Create a WhatsApp template to start sending approved messages to your contacts.</p>
                    <LoadingButton onClick={() => router.push('/dashboard/templates/new-template')} color="blue">Create Template</LoadingButton>
                </div>
            </>
        )
    }

    const showLeft = true //isBroadcast || params.headerParams.length > 0 || params.bodyParams.length > 0 || true

    return (
        <>

            <div className="grid grid-cols-2 h-[400px] md:h-[600px] gap-5">

                <div className={`w-full text-sm text-left text-gray-500 dark:text-gray-400 ${!showLeft ? "col-span-2" : ""}`}>

                    <table className="w-full">
                        <tbody>
                            {
                                templates.map((template, index) => {
                                    const components = template.components as MESSAGE_COMPONENT[]
                                    const bodyText = components.find(c => c.type === "BODY")?.text || ""
                                    
                                    return (
                                        <tr key={index}>
                                            <td className="p-2 w-8">
                                                <input 
                                                    type="checkbox"
                                                    checked={index === templateIndex}
                                                    onChange={() => setTemplateIndex(index)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="p-2">{template.name}</td>
                                            <td className="p-2">{bodyText}</td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>

                </div>

                {
                    showLeft && (
                        <div>
                            { isBroadcast && (
                                <div>

                                    <p>Selected Contacts: {props.selectedContacts?.length}</p>

                                    <Select id="contact-tag-select" name="Select Contact Tag" lists={tags} onChange={setTag} />
                            
                                </div>
                            )}

                            <div>
                                <TemplateVariables showSelect={isBroadcast} text={templateText} setParams={setParams} />
                            </div>
                        
                        </div>
                    )
                }

            </div>

            
            <LoadingButton loading={loading} onClick={onSubmit}> Send </LoadingButton>

        </>
    )
}


export default TemplatePreprocessor