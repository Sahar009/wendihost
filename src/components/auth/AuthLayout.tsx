import { PROJECT_NAME } from "@/libs/constants";
import Head from "next/head";
import Link from "next/link";
import React, { ReactNode } from "react";

interface IProps {
    children: ReactNode;
    reseller?: string;
}


const AuthLayout = (props: IProps) => {
    const reseller = props.reseller ? JSON.parse(props.reseller) : null;
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                <title>Auth - {reseller?.logoText || PROJECT_NAME || 'Wendi'}</title>
            </Head>
            
            <header className="py-6 px-6">
                <div className="container mx-auto flex justify-center">
                <Link href="/" className="text-5xl font-paytone text-[#0072E9] p-t2">
                        {reseller?.logoText || PROJECT_NAME || 'Wendi'}
                    </Link>
                </div>
            </header>
            
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        {props.children}
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            <Link href="/privacy" className="hover:underline">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AuthLayout;