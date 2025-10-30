import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ChatLayout from '@/components/dashboard/chat/ChatLayout'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'
import ChatBox from '@/components/dashboard/chat/ChatBox'



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

export default function ChatMessage(props: IProps) {

  const user = JSON.parse(props.user)

  return (
    <DashboardLayout user={user} hide={true}>

      <ChatLayout>

        <ChatBox />
        
      </ChatLayout>
    
    </DashboardLayout>
  )

}

