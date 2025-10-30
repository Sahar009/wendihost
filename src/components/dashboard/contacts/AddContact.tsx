import Input from "@/components/auth/Input"
import LoadingButton from "@/components/utils/LoadingButton"
import PhoneNumber from "@/components/utils/PhoneNumber"
import useInput from "@/hooks/useInput"
import axios from "axios"
import { useState } from "react"
import { toast } from "react-toastify"


interface IProps {
    workspaceId: number;
    refresh(): void
    handClose(): void
}

const AddContact = (props: IProps) => {

    const [loading, setLoading] = useState(false)

    const first = useInput("text", 3)
    const last = useInput("text", 3)
    const tag = useInput("text", 3)
    const email = useInput("email")
    const phone = useInput("phone")


    const onSubmit = async () => {

        setLoading(true)

        try {

            const body = {  
                firstName: first.value, 
                lastName: last.value, 
                email: email.value, 
                phone: phone.value,
                tag: tag.value  
            }

            const res = await axios.post(`/api/${props.workspaceId}/contacts/create`, body, { withCredentials: true })

            toast.success(res.data.message)

            props.handClose()
            props.refresh()

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
        <>

            <Input
                label='First Name' name='firstname' id='firstname' placeholder='e.g Jon' 
                helperText={first.errorMessage} value={first.value}
                onChange={(e) => first.setValue(e.target.value)} error={first.errorWarning}
                onFocus={() => first.setOnFocus(true)} type="text" />
            
            <Input
                label='Last Name' name='lastname' id='lastname' placeholder='e.g Doe' 
                helperText={last.errorMessage} value={last.value}
                onChange={(e) => last.setValue(e.target.value)} error={last.errorWarning}
                onFocus={() => last.setOnFocus(true)} type="text" />

            <PhoneNumber onChange={phone.setValue} phone={phone.value} />

            <Input
                label='Email' name='message' id='message' placeholder='Type email address here' 
                helperText={email.errorMessage} value={email.value}
                onChange={(e) => email.setValue(e.target.value)} error={email.errorWarning}
                onFocus={() => email.setOnFocus(true)} type="text" />

            <Input
                label='Tag' name='tag' id='message' placeholder='Type contact tag here' 
                helperText={tag.errorMessage} value={tag.value}
                onChange={(e) => tag.setValue(e.target.value)} error={tag.errorWarning}
                onFocus={() => tag.setOnFocus(true)} type="text" />
            
            <LoadingButton loading={loading} onClick={onSubmit}>Add Contact</LoadingButton>

        </>
    )
}


export default AddContact