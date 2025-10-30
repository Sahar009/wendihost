import axios from 'axios'
import { useState } from 'react'
import { BiDotsVerticalRounded } from 'react-icons/bi'
import { toast } from 'react-toastify';
import ModalWrapper from '../../utils/ModalWrapper';
import Select from '../../utils/Select';
import LoadingButton from '../../utils/LoadingButton';




interface IProps {
    id: number;
    workspaceId: string;
    refresh(): void;
    email: string
}

export default function TeamAction(props: IProps) {

    const { id, refresh, email } = props

    const [open, setOpen] = useState(false)
    const [select, setSelect] = useState("NONE")

    const [role, setRole] = useState(false)
    const [deactivate, setDeactive] = useState(false)
    

    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setOpen(false)
    }

    const handleCloseRole = () => {
        setRole(false)
    }

    const handleCloseDelete = () => {
        setDeactive(false)
    }


    const deleteCode = async () => {

        try {

            const body = {  id  }

            const res = await axios.post(`/api/${props.workspaceId}/team/delete`, body)

            toast.success(res.data.message)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        handleCloseDelete()
    }

    const reset = async () => {

        toast.info("Sending Request...")

        try {

            const body = {  id  }

            const res = await axios.post(`/api/${props.workspaceId}/team/reset-pass`, body)

            toast.success(res.data.message)


        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        handleClose()
    }


    const permission = async () => {

        setLoading(true)

        try {

            const body = {  id, role: select  }

            const res = await axios.post(`/api/${props.workspaceId}/team/role`, body)

            toast.success(res.data.message)

            handleCloseRole()

            refresh()


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
        <div>
            {
                open && <div onClick={handleClose} className='fixed top-0 left-0 h-screen w-screen cursor-default'></div>
            }
            <button className='mt-2' onClick={() => setOpen(true)}>
                <BiDotsVerticalRounded size={26} />
            </button> 
            {   
                open &&
                    <div className='relative top-[-10px] right-36'>
                        <div className='absolute w-40 text-base bg-white p-2 rounded-md shadow-2xl'>
                            <button onClick={() => setRole(true)}>
                                Change Permission
                            </button> 
                            <button onClick={reset}>
                                Reset Password
                            </button> 
                            <button onClick={() => setDeactive(true)}>
                                Delete
                            </button> 
                        </div>
                    </div>
            }

            <ModalWrapper title='Update Member' open={role} handleClose={handleCloseRole}>
                
                <Select 
                    id="name" name="name" label="Role"
                    lists={[
                        { value: "NONE", name: "Select Role"},
                        { value: "AGENT", name: "Agent"},
                        { value: "MANAGER", name: "Manager"},  
                    ]}
                    onChange={setSelect}
                    />
                
                <LoadingButton loading={loading} disabled={select === "NONE"} onClick={permission}>
                    Save
                </LoadingButton>

            </ModalWrapper>


            <ModalWrapper title='Delete Team account' open={deactivate} handleClose={handleCloseDelete}>

                <p className='text-center mb-10'>
                
                    Are You sure you want to delete


                    <strong> {email} </strong>
                </p>

                <LoadingButton color='red' loading={loading} onClick={deleteCode}>
                    Delete
                </LoadingButton>

            </ModalWrapper>

        </div>
    )

}
