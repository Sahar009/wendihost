import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'



export const getServerSideProps = withIronSessionSsr(async({req}) => {

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

export default function Chats(props: IProps) {

  const user = JSON.parse(props.user)

  return (
    <DashboardLayout user={user}>
      <div></div>
      {/* chat list */}
    </DashboardLayout>
  )

}
