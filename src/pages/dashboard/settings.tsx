import Tabs from '@/components/dashboard/Tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProfileSettings from '@/components/dashboard/settings/ProfileSettings';
import AccountSettings from '@/components/dashboard/settings/AccountSettings';
import Api from '@/components/dashboard/settings/Api';
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


export default function SettingsPage(props: IProps) {
  const [tab, setTab] = useState(0);
  const user = JSON.parse(props.user)

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 px-2 md:px-8 py-8">
        <h1 className="text-xl font-bold mb-4">Settings</h1>
        <Tabs
          tabs={["Profile settings", "Account", "Api"]}
          index={tab}
          setIndex={setTab}
        />
        {tab === 0 && <ProfileSettings />}
        {tab === 1 && <AccountSettings />}
        {tab === 2 && <Api />}
      </div>
    </DashboardLayout>
  );
}
