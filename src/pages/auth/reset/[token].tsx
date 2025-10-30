import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import useInput from "@/hooks/useInput";
import { AUTH_APIS, AUTH_ROUTES } from "@/libs/enums";
import { IAuthProps } from "@/libs/interfaces";
import { getResellerInfo } from "@/services/session";
import axios from "axios";
import { useRouter } from "next/router";
import { NextPageContext } from "next/types";
import React, { useState } from "react";
import { toast } from "react-toastify";


export const getServerSideProps = (async({req}: NextPageContext) => {

    const reseller = await getResellerInfo(req)

    return { 
      props: {
        user: true,
        reseller
      }, 
    }
})


const Reset = (props: IAuthProps) => {

    const password = useInput('password')
    const [passwordConfirm, setPasswordConfirm] = useState("")

    const isPassword = password.value === passwordConfirm

    const isDisabled =  password.error || !isPassword

    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

        setLoading(true)

        e.preventDefault()

        try {

            const body = {
                password: password.value,
                token: router.query.token
            }

            const res = await axios.post(AUTH_APIS.RESET, body)

            toast.success(res.data.message)

            setTimeout(() => {
                router.push(AUTH_ROUTES.LOGIN)
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
            <form className="w-full max-w-sm" onSubmit={onSubmit}>

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

                <Input 
                    id="password_conf" 
                    name="password_conf"
                    label="Password Confirm" 
                    type="password" 
                    placeholder="Confirm your password"
                    helperText={!isPassword ? "Passwords do not match" : ""}
                    error={!isPassword}
                    value={passwordConfirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
                />

                <LoadingButton disabled={isDisabled} loading={loading}> Reset </LoadingButton>

            </form>
        </AuthLayout>
    );
}

export default Reset;