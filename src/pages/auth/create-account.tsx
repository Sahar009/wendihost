import React, { useState } from "react";
import axios from 'axios';
import Head from "next/head";
// AuthLayout is not needed here as we're using a custom layout for this page
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import { AUTH_APIS, AUTH_ROUTES, DASHBOARD_ROUTES } from "@/libs/enums";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useInput from "@/hooks/useInput";
import { NextPageContext } from "next/types";
import { getResellerInfo } from "@/services/session";
import { signInWithGoogle } from "@/libs/firebase-client";
import { IAuthProps } from "@/libs/interfaces";
import { FaEye, FaEyeSlash, FaGoogle, FaArrowLeft, FaSpinner } from "react-icons/fa";
import {MessageCircle,Bot,GalleryVerticalEnd} from "lucide-react"
import Logo from '@/components/utils/Logo';

export const getServerSideProps = (async ({ req }: NextPageContext) => {

    const reseller = await getResellerInfo(req)

    return {
        props: { user: true, reseller },
    }

})

const CreateAccount = (props: IAuthProps) => {
    const router = useRouter();
    const reseller = props.reseller ? JSON.parse(props.reseller as string) as any : null;

    const first = useInput("text", 2)
    const last = useInput("text", 2)
    const email = useInput('email')
    const password = useInput('password')
    const [passwordConfirm, setPasswordConfirm] = useState("")

    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);


    const isPassword = password.value === passwordConfirm

    const isDisabled = first.error || last.error || email.error || password.error || !isPassword || googleLoading;

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            // Clear any previous errors
            toast.dismiss();
            
            // Show loading toast
            const toastId = toast.loading('Opening Google sign in...');
            
            const result = await signInWithGoogle();
            
            if (result.success) {
                toast.update(toastId, {
                    render: 'Sign in successful! Redirecting...',
                    type: 'success',
                    isLoading: false,
                    autoClose: 2000
                });
              
                    router.push('/dashboard');
               
            } else {
                throw new Error(result.error || 'Failed to sign in with Google');
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
        } finally {
            setGoogleLoading(false);
        }
    };

    const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

        setLoading(true)

        e.preventDefault()

        try {

            const body = {
                email: email.value,
                password: password.value,
                firstName: first.value,
                lastName: last.value,
            }

            const res = await axios.post(AUTH_APIS.SIGN_UP, body)

            toast.success(res.data.message)

            // Redirect to create workspace page after successful signup
            setTimeout(() => {
                router.push('/dashboard/create-workspace')
            }, 1000)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                console.log(e.status)
                console.error(e.response);
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        setLoading(false)

    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left side with background image and content */}
            <div className="hidden lg:flex lg:w-[50%] bg-cover bg-center relative overflow-hidden rounded-3xl max-w-4xl m-4 "
                style={{ backgroundImage: 'url(/login-bg.png)' }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40"></div>

                {/* Main content container */}
                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Main content */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="max-w-md">
                            <h2 className="text-4xl font-bold text-white mb-6 font-paytone">
                                Take your marketing to the next level with Wendi
                            </h2>

                            <div className="space-y-8 mt-12">
                                {/* Feature 1 */}
                                <div className="flex items-start bg-white/90 justify-center align-center m-2 p-2 rounded-2xl flex">
                                    <div className="flex-shrink-0 bg-grey- p-2 rounded-lg">
                                    <Bot className="text-primary"/>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-800">FREE WhatsApp Business API</h3>
                                        <p className="mt-1 text-gray-600">Instant verification & setup with Meta</p>
                                    </div>
                                </div>

                                {/* Feature 3 - Marketing Templates */}
                                <div className="flex items-start bg-white/90 hover:bg-white transition-all duration-300 m-2 p-4 rounded-2xl">
                                    <div className="flex-shrink-0 bg-grey-300 p-3 rounded-xl">
                                    <MessageCircle className="text-primary"/>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Customised chatbots</h3>
                                        <p className="mt-1 text-gray-600">Easily set up chatbots to reply to customers</p>
                                    </div>
                                </div>

                                {/* Feature 4 - Secure & Reliable */}
                                <div className="flex items-start bg-white/90 hover:bg-white transition-all duration-300 m-2 p-4 rounded-2xl">
                                    <div className="flex-shrink-0 bg-grey-300 p-3 rounded-xl">
                                  <GalleryVerticalEnd className="text-primary"/>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Marketing templates </h3>
                                        <p className="mt-1 text-gray-600">Setup templates to market your products</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Right side with form */}
            <div className="w-full lg:w-1/2 flex flex-col lg:justify-center">
                <div className="p-6">
                    <Logo logoText={reseller?.logoText} />
                    <p className="text-md font-bold text-gray-500 mb-2">Create a wendi account</p>

                </div>


                <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl shadow-lg p-8">

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-2.5 px-4 mb-6 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {googleLoading ? (
                                <FaSpinner className="animate-spin text-gray-500" />
                            ) : (
                                <FaGoogle className="text-red-500" />
                            )}
                            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <FaArrowLeft className="mr-2" />
                                    Back to login
                                </button>
                            </div>

                           
                                <div>
                                    <Input
                                        id="firstname"
                                        name="firstname"
                                        label="First Name"
                                        type="text"
                                        placeholder="Enter your first name"
                                        helperText={first.errorMessage}
                                        error={first.errorWarning}
                                        value={first.value}
                                        onChange={(e) => first.setValue(e.target.value)}
                                        onFocus={() => first.setOnFocus(true)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        id="lastname"
                                        name="lastname"
                                        label="Last Name"
                                        type="text"
                                        placeholder="Enter your last name"
                                        helperText={last.errorMessage}
                                        error={last.errorWarning}
                                        value={last.value}
                                        onChange={(e) => last.setValue(e.target.value)}
                                        onFocus={() => last.setOnFocus(true)}
                                    />
                                </div>

                            <Input
                                id="email" 
                                name="email"
                                label="Email" 
                                type="email"
                                placeholder="Enter your email address"
                                helperText={email.errorMessage} 
                                error={email.errorWarning}
                                value={email.value} 
                                onChange={(e) => email.setValue(e.target.value)}
                                onFocus={() => email.setOnFocus(true)}
                            />

                            <Input
                                id="password" 
                                name="password"
                                label="Password" 
                                type="password"
                                placeholder="Enter your password"
                                helperText={password.errorMessage} 
                                error={password.errorWarning}
                                value={password.value} 
                                onChange={(e) => password.setValue(e.target.value)}
                                onFocus={() => password.setOnFocus(true)}
                            />

                            <Input
                                id="password_conf" 
                                name="password_conf"
                                label="Password Confirm" 
                                type="password"
                                placeholder="Confirm your password"
                                helperText={!isPassword ? "Passwords do not match" : ""}
                                error={!isPassword && passwordConfirm.length > 0}
                                value={passwordConfirm} 
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                onFocus={() => {}}
                            />

                            <div className="pt-2">
                                <LoadingButton
                                    disabled={isDisabled}
                                    loading={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                                >
                                    Create Account
                                </LoadingButton>
                            </div>

                            <p className="mt-6 text-center text-sm text-gray-600">
                                By signing up, you agree to our
                                <Link href="/terms" className="text-blue-600 hover:underline ml-1">Terms of Service</Link> and
                                <Link href="/privacy" className="text-blue-600 hover:underline ml-1">Privacy Policy</Link>.
                            </p>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link href={AUTH_ROUTES.LOGIN} className="font-medium text-blue-600 hover:underline">
                                        Log in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CreateAccount;