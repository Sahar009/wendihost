import LoadingButton from "@/components/utils/LoadingButton"
import MessageBox from "./MessageBox"
import AssignChat from "./AssignChat"
import { useEffect, useRef, useState } from "react"
import axios, { AxiosResponse } from "axios"
import { ApiResponse } from "@/libs/types"
import useSWR from 'swr'
import { Conversation, Message } from "@prisma/client"
import { useRouter } from "next/router"
import MessageWidget from "./MessageWidget"
import { useDispatch, useSelector } from "react-redux"
import { fetchMessages, loadMessage, } from "@/store/slices/messageSlice"
import ModalWrapper from "@/components/utils/ModalWrapper"
import UserProfile from "./UserProfile"
import { getCurrentWorkspace } from "@/store/slices/system"



const ChatBox = () => {
    const { id: workspaceId } = useSelector(getCurrentWorkspace)
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const dispatch = useDispatch()
    const router = useRouter()
    const messagesEndRef = useRef<any>(null)
    const phone = router.query.phone

    const getConversation = useSWR(`/api/${workspaceId}/chats/${phone}`, axios)
    
    const getMessages = useSWR(
        `/api/${workspaceId}/chats/${phone}/messages?start=0`, 
        axios, 
        { refreshInterval: 1000 }
    )

    const [conversation, setConversation] = useState<Conversation>()
    const messages = useSelector(fetchMessages)

    useEffect(() => {
        const res = getConversation?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) setConversation(data?.data)
    }, [getConversation?.data])

    useEffect(() => {
        const res = getMessages?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) {
            dispatch(loadMessage(data?.data));
        }
    }, [getMessages?.data, dispatch])

    const changeStatus = async () => {
        setLoadingStatus(true)
        const body = { chatId: conversation?.id, status: conversation?.status }
        try {
            const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chats/${phone}/status`, body)
            const data : ApiResponse = res?.data
            if (data?.data) setConversation(data?.data?.conversation)
        } catch (e) {
        }
        setLoadingStatus(false)
    }

    const scrollToBottom = () => {
        messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <div className='h-[calc(100dvh_-_10rem)] md:h-[calc(100dvh_-_2.1rem)] flex flex-col bg-[#efeae2]'>
            {/* WhatsApp style header */}
            <div className="flex h-16 items-center bg-[#f0f2f5] px-4 shadow-sm">

                <div onClick={() => setShowProfile(true)} className="flex items-center flex-1 cursor-pointer">
                    <img 
                        src="/icons/user-profile.png"
                        alt="Profile" 
                        className="w-10 h-10 rounded-full"/>
                    <div className="ml-4">
                        <div className="font-medium">{phone as string}</div>
                        <div className="text-sm text-gray-500">
                            {conversation?.status === "open" ? "Active" : "Closed"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-40 ">
                    <AssignChat 
                        workspaceId={workspaceId} 
                        chatId={conversation?.id} 
                        memberId={conversation?.memberId} />
                    <LoadingButton 
                        loading={loadingStatus} 
                        onClick={changeStatus}>
                        {conversation?.status === "open" ? "Close" : "Open"}
                    </LoadingButton>
                </div>
            </div>

            {/* Messages area with WhatsApp style background */}
            <div className="grow overflow-y-auto px-8 py-4">
                {messages?.map((message: Message, index: number) => (
                    <MessageWidget message={message} key={index} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <MessageBox conversation={conversation as Conversation} />

            <ModalWrapper 
                title="User Profile" 
                open={showProfile}
                handleClose={() => setShowProfile(false)}>
                <UserProfile onClose={() => setShowProfile(false)} workspaceId={workspaceId} />
            </ModalWrapper>

        </div>
    )
} 

export default ChatBox