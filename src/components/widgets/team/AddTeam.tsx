import Input from "@/components/auth/Input"
import LoadingButton from "@/components/utils/LoadingButton"
import useInput from "@/hooks/useInput"
import axios from "axios"
import { useState } from "react"
import { toast } from "react-toastify"
import Select from "../../utils/Select"


interface IProps {
    workspaceId: string;
    refresh(): void
    handClose(): void
}

const AddTeam = (props: IProps) => {

    const [loading, setLoading] = useState(false)
    const [select, setSelect] = useState("AGENT")

    const first = useInput("text", 3)
    const email = useInput("email")


    const onSubmit = async () => {

        setLoading(true)

        try {

            const body = {  
                name: first.value, 
                email: email.value, 
                role: select
            }

            const res = await axios.post(`/api/${props.workspaceId}/team/create`, body)

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
                label='Name' 
                name='name' 
                id='name' 
                placeholder='e.g Jon' 
                helperText={first.errorMessage} 
                value={first.value}
                onChange={(e) => first.setValue(e.target.value)} 
                error={first.errorWarning}
                onFocus={() => first.setOnFocus(true)} 
                type="text"
            />

            <Input
                label='Email' 
                name='email' 
                id='email' 
                placeholder='Type email address here' 
                helperText={email.errorMessage} 
                value={email.value}
                onChange={(e) => email.setValue(e.target.value)} 
                error={email.errorWarning}
                onFocus={() => email.setOnFocus(true)} 
                type="email"
            />

            <Select 
                id="name" name="name" label="Role"
                lists={[
                    { value: "AGENT", name: "Agent"},
                    { value: "MANAGER", name: "Manager"},  
                ]}
                onChange={setSelect}
                />
            
            <LoadingButton loading={loading} onClick={onSubmit}>Add Member</LoadingButton>

        </>
    )
}


export default AddTeam