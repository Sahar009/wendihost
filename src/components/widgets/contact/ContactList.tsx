import axios, { AxiosResponse } from "axios"
import useSWR from 'swr'
import { useState, useEffect } from "react"
import { ApiResponse } from "@/libs/types"
import { Contact, Conversation } from "@prisma/client"
import { useSelector } from "react-redux"
import ContactHead from "./ContactHead"
import { getCurrentWorkspace } from "@/store/slices/system"



interface IChats extends Conversation {
    contact: Contact[]
}

interface IProps {
    index: number;
}

const ContactList = (props: IProps) => {

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const [data, setData] = useState<IChats[]>([])

    let filterBy = "open"

    switch (props.index) {
        case 0:
            filterBy = "open"
            break
        case 1:
            filterBy = "assigned"
            break
        case 2:
            filterBy = "unassigned"
            break
        default:
            filterBy = "open"
    }

    const getChats = useSWR(workspaceId && workspaceId > 0 ? `/api/${workspaceId}/chats/get-all?page=1&filterBy=${filterBy}` : null, axios)

    useEffect(() => {
        const res = getChats?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) {   
            setData(data?.data?.chats)  
        }
    }, [getChats])


    if (!workspaceId || workspaceId <= 0) {
        return (
            <div className="text-sm text-gray-500 text-center py-4">
                No workspace selected
            </div>
        )
    }

    if (getChats.error) {
        return (
            <div className="text-sm text-red-500 text-center py-4">
                Error loading contacts
            </div>
        )
    }

    if (getChats.isLoading) {
        return (
            <div className="text-sm text-gray-500 text-center py-4">
                Loading contacts...
            </div>
        )
    }

    return (
        <div className="text-sm">
            {data.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                    No contacts found
                </div>
            ) : (
                data.map((conversation, index: number) => {
                    const contact = conversation.contact?.[0]
                    return ( 
                        <ContactHead key={index} connversation={conversation} contact={contact} />
                    )
                })
            )}
        </div>
    )

}

export default ContactList