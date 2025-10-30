import React, { useEffect, useState } from 'react';
import { withIronSessionSsr } from 'iron-session/next'
import 'reactflow/dist/style.css';
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import ChatbotBuilder from '@/components/chatbot/ChatbotBuilder';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/router';
import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '@/libs/types';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useSelector } from 'react-redux';


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

export default function Builder(props: IProps) {

    const router = useRouter()

    const [chatbot, setChatbot] = useState(null)

    const user = JSON.parse(props.user)

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getChatbot = useSWR(`/api/${workspaceId}/chatbot/get-bot?id=${router.query.id}`, axios)

    const refreshChatbot = () => {
        mutate(`/api/${workspaceId}/chatbot/get-bot?id=${router.query.id}`)
    }

    useEffect(() => {
        const res = getChatbot?.data as AxiosResponse

        const data : ApiResponse = res?.data

        if (data?.data) {
            setChatbot(data.data)
        } else  {

        } 


    }, [getChatbot.data])

    return (
        <DashboardLayout user={user} hide={true}>
            { getChatbot.isLoading && <div>Loading...</div> }
            { getChatbot.error && <div>Loading...</div> }
            { chatbot && <ChatbotBuilder chatbot={chatbot} onRefresh={refreshChatbot} /> }
        </DashboardLayout>
    )
}
