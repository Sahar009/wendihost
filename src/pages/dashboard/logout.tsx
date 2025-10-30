import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/dashboard/Card'
import LoadingButton from '@/components/utils/LoadingButton'
import { PROJECT_NAME } from '@/libs/constants'
import { sessionCookie, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Tabs from '@/components/dashboard/Tabs'
import { AUTH_ROUTES } from '@/libs/enums'




export const getServerSideProps = withIronSessionSsr(async({req}) => {

    req.session.destroy();

    return {
        redirect: {
            destination: AUTH_ROUTES.LOGIN,
            permanent: false,
        },
    } 
}, sessionCookie())


interface IProps {
    user: string;
}

export default function Logout(props: IProps) {

    return (
        <div>
        
        </div>
    )

}
