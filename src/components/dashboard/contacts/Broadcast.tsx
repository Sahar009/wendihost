import LoadingButton from "@/components/utils/LoadingButton"
import { MESSAGE_COMPONENT, MESSAGE_TEMPLATE } from "@/libs/interfaces"
import { ApiResponse } from "@/libs/types"
import axios, { AxiosResponse } from "axios"
import { useEffect, useMemo, useState } from "react"
import useSWR from 'swr'
import { toast } from "react-toastify"
import Select from "@/components/utils/Select"
import { useSelector } from "react-redux"
import { getCurrentWorkspace } from "@/store/slices/system"


interface IProps {
    workspaceId: string;
    selectedContacts: number[];
    tags: { tag: string }[];
    refresh(): void
    handClose(): void
}

const Broadcast = (props: IProps) => {

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getTemplates = useSWR(`/api/${workspaceId}/template/get?page=${1}&status=APPROVED`, axios)

    const tags = useMemo(() => {
        return [{name: "All", value: "all"}, ...props.tags.map((tag) => ({ name: tag.tag.charAt(0).toUpperCase() + tag.tag.slice(1), value: tag.tag }))]
    }, [props.tags])

    const [loading, setLoading] = useState(false)
    const [templateIndex, setTemplateIndex] = useState(-1)
    const [templates, setTemplates] = useState<MESSAGE_TEMPLATE[]>([])
    const [tag, setTag] = useState("all")


    useEffect(() => {
        const res = getTemplates?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data?.length > 0) setTemplates(data?.data)
    }, [getTemplates])

    const onSubmit = async () => {

        if (templateIndex < 0) return

        setLoading(true)

        const template = templates[templateIndex]

        try {

            const body = {  
                toAll: tag === "all",
                selectedContacts: props.selectedContacts,
                templateId: template.id, 
                templateName: template.name, 
                templateComponent: JSON.stringify(template.components) ,
                tag
            }

            const res = await axios.post(`/api/${props.workspaceId}/broadcast/send`, body)

            toast.success(res.data.message)

            props.handClose()
            props.refresh()

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
        <>

            <div className="grid grid-cols-2 h-[400px] md:h-[600px] gap-5">

                <div className="w-full text-sm text-left text-gray-500 dark:text-gray-400 ">

                    {
                        templates.map((template, index) => {

                            const components = template.components as MESSAGE_COMPONENT[]

                            return (
                                <div key={index} className={`flex justify-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer ${index === templateIndex ? "bg-gray-300 hover:bg-gray-300" : ""} `} onClick={() => setTemplateIndex(index)}>

                                    <p className='flex items-center'>{template.name}</p>
    
                                    <p>
                                        {
                                            components.map((component) => {
                                                if (component.type === "BODY") return component.text
                                                return ""
                                            })
                                        }
                                    </p>
                            
                                </div>
                            )
                        })
                    }

                </div>

                <div>


                    <p>Selected Contacts: {props.selectedContacts.length}</p>


                    <Select 
                        id="contact-tag-select" 
                        name="Select Contact Tag" 
                        lists={tags} 
                        onChange={setTag} 
                        />

                </div>

            </div>

            
            <LoadingButton loading={loading} onClick={onSubmit}>Send</LoadingButton>

        </>
    )
}


export default Broadcast