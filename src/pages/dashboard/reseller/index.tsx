import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Tabs from '@/components/dashboard/Tabs'
import ResellerSettings from '@/components/dashboard/reseller/ResellerSettings'
import ResellerUsers from '@/components/dashboard/reseller/ResellerUsers'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'
import { useState } from 'react'


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

export default function Reseller(props: IProps) {

    const user = JSON.parse(props.user)

    const [data, setData] = useState([])

    const [loading, setLoading] = useState(false)

    const [index, setIndex] = useState(0)


    return (
        <DashboardLayout user={user}>

            <Tabs tabs={["Users", "White Label"]} setIndex={setIndex} index={index} />

            { index === 0 && <ResellerUsers />}

            { index === 1 && <ResellerSettings />}

        </DashboardLayout>
    )

}