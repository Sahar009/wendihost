import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import useInput from "@/hooks/useInput";
import { ApiResponse } from "@/libs/types";
import { getChatId, setChatId } from "@/store/slices/conversationSlice";
import axios, { AxiosResponse } from "axios";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import useSWR from "swr";


const UserProfile = ({workspaceId, onClose}: {workspaceId: number, onClose: () => void}) => {

    const dispatch = useDispatch()
    const router = useRouter()
    const phone = router.query.phone

    const first = useInput("text", 3)
    const last = useInput("text", 3)
    const email = useInput("email", 3)
    const tag = useInput("text", 3)
    
    const [loading, setLoading] = useState(false)

    const getChat = useSWR(`/api/${workspaceId}/chats/${phone}/get-chat`, axios)

    const chatId = useSelector(getChatId)

    useEffect(() => {
            
        const res = getChat?.data as AxiosResponse

        const data : ApiResponse = res?.data

        if (data?.data) dispatch(setChatId(data?.data?.id))

        if (data?.data?.contact?.length === 1) {
            const contact = data?.data?.contact?.[0]
            first.setValue(contact?.firstName)
            last.setValue(contact?.lastName)
            email.setValue(contact?.email)
            tag.setValue(contact?.tag)
        } else  {
            first.setValue("")
            last.setValue("")
            email.setValue("")
            tag.setValue("new")
        } 

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getChat.data])


    const save = async () => {

        setLoading(true)

        const body = { 
            firstName: first.value,
            lastName: last.value,
            email: email.value,
            tag: tag.value,
            chatId: chatId,
        }

        try {
            const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chats/${phone}/save-contact`, body)

            const data : ApiResponse = res?.data

            toast.success(data.message)

        } catch (e) {

        }

        setLoading(false)

        onClose()

    }

    return (                 
        <div className='h-full hidden md:block'>
                        
            <div className="flex flex-col p-2 border-b-[1px]" >
                <div>
                    <Image width={"160"} height={"160"} alt='USER' src={"/icons/user-profile.png"} />
                </div>
                <p className='font-bold m-3'>{phone}</p>
            </div>

            <div className='p-2 text-sm'>

                <Input
                    id="first-name" name='first-name' helperText=''
                    label='First name' value={first.value} onChange={(e) => first.setValue(e.target.value)}
                    type='text' />
                
                <Input 
                    id="last-name" name='last-name' helperText=''
                    label='Last name' value={last.value} onChange={(e) => last.setValue(e.target.value)}
                    type='text' />
                
                <Input 
                    id="email" name='email' helperText=''
                    label='Email' value={email.value} onChange={(e) => email.setValue(e.target.value)}
                    type='email' />

                <Input 
                    id="tag" name='tag' helperText=''
                    label='Group or Tag' value={tag.value} onChange={(e) => tag.setValue(e.target.value)}
                    type='text' />

                <LoadingButton loading={loading} onClick={save}> Save </LoadingButton>

            </div>

        </div>
    );
}   

export default UserProfile;