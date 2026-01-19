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
import { persistor } from '@/store'



export const getServerSideProps = withIronSessionSsr(async ({ req }) => {

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

    useEffect(() => {
        // Clear Redux persist store on logout
        persistor.purge().then(() => {
            console.log('Redux persist store cleared on logout');
        }).catch((error) => {
            console.error('Error clearing Redux persist store:', error);
        });
    }, []);

    return (
        <div>

        </div>
    )

}
