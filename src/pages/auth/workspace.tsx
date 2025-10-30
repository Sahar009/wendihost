import Link from "next/link";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import { AUTH_APIS, AUTH_ROUTES, DASHBOARD_ROUTES } from "@/libs/enums";
import useInput from "@/hooks/useInput";
import { getResellerInfo } from "@/services/session";
import { NextPageContext } from "next/types";
import { IAuthProps } from "@/libs/interfaces";


export const getServerSideProps = (async({req}: NextPageContext ) => {

    const reseller = await getResellerInfo(req)

    return { 
      props: {  user: true,  reseller }, 
    }
    
})


const LoginWorkspace = (props: IAuthProps) => {

    const workspace = useInput("text")
    const email = useInput("email")
    const password = useInput("password")

    const [loading, setLoading] = useState(false)

    const isDisabled = password.error || email.error 

    const router = useRouter()

    const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

        setLoading(true)

        e.preventDefault()

        try {

            const body = {
                email: email.value, 
                password: password.value,
                workspaceId: workspace.value
            }

            const res = await axios.post(AUTH_APIS.LOGIN_TEAM, body)

            toast.success(res.data.message)

            localStorage.clear() //Clear all local storage data

            setTimeout(() => {
                router.push(DASHBOARD_ROUTES.DASHBOARD)
            }, 1000)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        setLoading(false)

    }

    

    return (
        <AuthLayout reseller={props.reseller}>

            <div className="flex flex-col items-center w-full">

                <form onSubmit={onSubmit} className="w-full max-w-sm">

                    <Input 
                        id="workspace" 
                        name="workspace"
                        label="Workspace" 
                        type="text" 
                        placeholder="Enter the Workspace ID"
                        helperText={workspace.errorMessage}
                        error={workspace.errorWarning}
                        value={workspace.value as string}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => workspace.setValue(e.target.value)}
                        onFocus={() => workspace.setOnFocus(true)}
                    />

                    <Input 
                        id="email" 
                        name="email"
                        label="Email" 
                        type="email" 
                        placeholder="Enter your email address"
                        helperText={email.errorMessage}
                        error={email.errorWarning}
                        value={email.value as string}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => email.setValue(e.target.value)}
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
                        value={password.value as string}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => password.setValue(e.target.value)}
                        onFocus={() => password.setOnFocus(true)}
                    />

                    <LoadingButton //disabled={isDisabled} 
                        loading={loading}> Login </LoadingButton>

                </form>

            </div>

        </AuthLayout>
    );
}

export default LoginWorkspace;