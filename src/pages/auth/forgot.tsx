import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import useInput from "@/hooks/useInput";
import { AUTH_APIS, AUTH_ROUTES } from "@/libs/enums";
import { IAuthProps } from "@/libs/interfaces";
import { getResellerInfo } from "@/services/session";
import axios from "axios";
import Link from "next/link";
import { NextPageContext } from "next/types";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";


export const getServerSideProps = async ({ req }: NextPageContext) => {
  try {
    const reseller = await getResellerInfo(req);
    console.log({ reseller });
    
    return { 
      props: {
        user: true,
      }, 
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: false,
      },
    };
  }
};


const Forgot = (props: IAuthProps) => {

    const email = useInput("email")

    const [loading, setLoading] = useState(false)


    const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

        setLoading(true)

        e.preventDefault()

        try {

            const body = {  email: email.value  }

            const res = await axios.post(AUTH_APIS.FORGOT, body)

            toast.success(res.data.message)

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

            <div className="flex flex-col items-center  w-full my-2">
                <h2 className="text-md font-bold text-primary m-6 font-paytone">Enter your email</h2>
                <form className="w-full max-w-sm p-1 my-2" onSubmit={onSubmit}>
                    <Input 
                        id="email" 
                        name="email"
                        label="Email" 
                        type="email" 
                        placeholder="Enter your email address"
                        helperText=""  
                        error={email.errorWarning}
                        value={email.value}  
                        onChange={(e) => email.setValue(e.target.value)}
                        onFocus={() => email.setOnFocus(true)}
                    />

                    <LoadingButton loading={loading}> Send Reset Link </LoadingButton>

                </form>

                <p className="flex mt-2">
                    Don&apos;t have an Account? 
                    <Link className="ml-1 text-blue-600" href={AUTH_ROUTES.CREATE_ACCOUNT}> Create Account </Link> 
                </p>

            </div>


        </AuthLayout>
    );
}

export default Forgot;