import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { NextPageContext } from "next/types";
import { signInWithGoogle } from "@/libs/firebase-client";

import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/auth/Input";
import { AUTH_APIS, AUTH_ROUTES, DASHBOARD_ROUTES } from "@/libs/enums";
import useInput from "@/hooks/useInput";
import { getResellerInfo } from "@/services/session";
import { IAuthProps } from "@/libs/interfaces";
import LoadingButton from "@/components/utils/LoadingButton";

interface LoginFormData {
    email: string;
    password: string;
}

interface LoginFormData {
    email: string;
    password: string;
}

export const getServerSideProps = (async ({ req }: NextPageContext) => {

    const reseller = await getResellerInfo(req)

    return {
        props: {
            user: true,
            reseller
        },
    }

})

const Login = (props: IAuthProps) => {

    const email = useInput("email");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const isDisabled = email.error || !password || !email.value || loading;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const body = {
                email: email.value,
                password: password
            };

            const res = await axios.post(AUTH_APIS.LOGIN, body);
            toast.success(res.data.message);
            localStorage.clear(); // Clear all local storage data

            setTimeout(() => {
                router.push(DASHBOARD_ROUTES.DASHBOARD);
            }, 1000);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'An error occurred');
            } else {
                console.error('Login error:', error);
                toast.error('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
      try {
        setLoading(true);
        // Clear any previous errors
        toast.dismiss();
        
        // Show loading toast
        const toastId = toast.loading('Opening Google sign in...');
        
        const result = await signInWithGoogle();
        console.log('Google sign in result:', result);
        
        if (result?.success) {
          toast.update(toastId, {
            render: 'Successfully signed in!',
            type: 'success',
            isLoading: false,
            autoClose: 3000
          });
          router.push('/dashboard');
        } else if (result?.error) {
          if (!result.error.includes('cancelled')) {
            toast.update(toastId, {
              render: `Sign in failed: ${result.error}`,
              type: 'error',
              isLoading: false,
              autoClose: 5000
            });
          } else {
            toast.dismiss(toastId);
          }
        }
      } catch (error) {
        console.error('Google sign in error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
        
        // Don't show toast for user cancellation
        if (!errorMessage.includes('popup-closed') && !errorMessage.includes('cancelled')) {
          toast.error(`Error: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };
      

    return (
        <AuthLayout reseller={props.reseller}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#0072E9] mb-2">Log in to your workspace</h1>
               
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={email.value as string}
                            onChange={(e) => email.setValue(e.target.value)}
                            onFocus={() => email.setOnFocus(true)}
                            onBlur={() => email.setOnFocus(false)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {email.errorWarning && (
                            <p className="mt-1 text-sm text-red-600">
                                {email.errorMessage}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                      
                    </div>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <Link href={AUTH_ROUTES.FORGOT} className="text-sm font-medium text-primary hover:text-primary/80">
                            Forgot password?
                        </Link>
                </div>

                {/* <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                    </label>
                </div> */}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isDisabled}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaGoogle className="h-5 w-5 text-red-500" />
                            <span>Continue with Google</span>
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href={AUTH_ROUTES.CREATE_ACCOUNT} className="font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                    Create Account
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default Login;