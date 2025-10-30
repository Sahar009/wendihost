import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllWorkspace, getCurrentWorkspace, setAllWorkspace, setCurrentWorkspace } from "@/store/slices/system";
import useInput from "@/hooks/useInput";
import Textarea from "../utils/Textarea";
import Input from "../auth/Input";
import { toast } from "react-toastify";
import axios from "axios";
import { ApiResponse } from "@/libs/types";


interface IProps {
    handleClose: () => void,
}


const CreateWorkspace = (props: IProps) => {

    const name = useInput("text", 3)
    const description = useInput("text", 10)
    const dispatch = useDispatch()
    const workspaces = useSelector(getAllWorkspace)


    const create = async () => {
        try {
            const res = await axios.post(`/api/workspace/create`, {
                name: name.value,
                description: description.value
            })

            const data : ApiResponse = res?.data

            if (data?.status) {
                toast.success(data?.message)
                name.setValue("")
                description.setValue("")
                props.handleClose()
                dispatch(setAllWorkspace([...workspaces, data?.data]))
            } else {
                toast.error(data?.message)
            }

        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Input 
                label="Workspace Name"
                name="workspaceName"
                id="workspaceName"
                value={name.value}
                error={name.error}
                onChange={(e) => name.setValue(e.target.value)}
                onFocus={() => name.setOnFocus(true)}
                onBlur={() => name.setOnFocus(false)}
                type="text" 
                helperText={name.errorWarning ? name.errorMessage : ''}
                placeholder="Workspace Name" />
            <Textarea
                label="Workspace Description"
                name="workspaceDescription"
                id="workspaceDescription"
                value={description.value}
                error={description.error}
                onChange={(value) => description.setValue(value)}
                onFocus={() => description.setOnFocus(true)}
                helperText={description.errorWarning ? description.errorMessage : ''}
                placeholder="Workspace Description" />
            <button onClick={create} className="p-2 bg-green-700 text-white rounded-md">Create</button>
        </div>
    );
}

export default CreateWorkspace;