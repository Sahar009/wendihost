import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { withIronSessionSsr } from 'iron-session/next'
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {

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

// Card component
const AutomationCard = ({ imageSrc, title, description, buttonText, onClick }: {
    imageSrc: string;
    title: string;
    description: string;
    buttonText: string;
    onClick?: () => void;
}) => (
    <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center flex-1 min-h-[380px]">
        <div className='flex flex-col items-center justify-center bg-[#F5F5F5] w-full rounded-lg p-8 mb-6'>
            <div className="mb-4">
                <Image src={imageSrc} alt={title} width={120} height={120} className="object-contain" />
            </div>
        </div>
        <h3 className="font-semibold text-xl text-center mb-2">{title}</h3>
        <p className="text-gray-500 text-sm text-center mb-6 flex-1">{description}</p>
        <button
            className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition text-base"
            onClick={onClick}
        >
            {buttonText}
        </button>
    </div>
);

const automations = [
    {
        imageSrc: '/images/Frame.png',
        title: 'Create WhatsApp widget',
        description: 'Make a whatsapp widget to embed on your website for customers to reach you easily',
        buttonText: 'Setup',
        route: '/dashboard/automations/whatsapp-widget',
    },
    {
        imageSrc: '/images/campaign-automation.png',
        title: 'Campaign Automation',
        description: 'Create and manage bulk WhatsApp campaigns to engage with multiple customers simultaneously',
        buttonText: 'Create Campaign',
        route: '/dashboard/automations/campaign',
    },
    {
        imageSrc: '/images/ai-automation.png',
        title: 'AI Automation',
        description: 'Leverage AI to automate responses and handle customer inquiries 24/7',
        buttonText: 'Setup',
        route: '/dashboard/automations/ai',
    },
    {
        imageSrc: '/images/settings-automation.png',
        title: 'Automation Settings',
        description: 'Configure working hours, automation rules, and response settings for your chat system',
        buttonText: 'Configure',
        route: '/dashboard/automations/settings',
    },
];

const AutomationsPage = (props: IProps) => {
    const user = props.user ? JSON.parse(props.user) : {};
    const router = useRouter();

    const handleCardClick = (route: string) => {
        router.push(route);
    };

    return (
        <DashboardLayout user={user}>
            <div className="min-h-screen bg-gray-50 p-8">
                <h1 className="text-2xl font-bold mb-8 text-black">Automation</h1>
                <div className="flex flex-col md:flex-row gap-6  md:items-stretch">
                    {automations.map((card, idx) => (
                        <AutomationCard
                            key={idx}
                            {...card}
                            onClick={() => handleCardClick(card.route)}
                        />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AutomationsPage;
