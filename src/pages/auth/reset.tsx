import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import useInput from "@/hooks/useInput";
import { IAuthProps } from "@/libs/interfaces";
import { getResellerInfo } from "@/services/session";
import { NextPageContext } from "next/types";
import React, { useEffect, useState } from "react";


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


    useEffect(() => {

    }, [])

    return (
        <AuthLayout reseller={props.reseller}>
            <form className="w-full max-w-sm">

                <Input 
                    id="password" 
                    name="password"
                    label="Password" 
                    type="password" 
                    placeholder="Enter your password"  
                    helperText={password.errorMessage}  
                    error={password.errorWarning}
                    value={password.value as string}
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
                    error={!isPassword}
                    value={passwordConfirm}  
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                />

                <LoadingButton disabled={isDisabled}> Reset </LoadingButton>

            </form>
        </AuthLayout>
    );
}

export default Reset;