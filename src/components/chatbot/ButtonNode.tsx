import React, { useEffect, useState } from "react"
import Input from "../auth/Input"
import { Handle, Node, Position } from "reactflow"
import { useDispatch } from "react-redux"
import { updateMessage } from "@/store/slices/chatbotBuilderSlice"


interface IProps extends Node {

}

const ButtonNode = (props: IProps) => {

    const dispatch = useDispatch()

    const { id, data } = props

    const [message, setMessage] = useState(() => {
        const initialMessage = data.message || "";
        return typeof initialMessage === 'string' ? initialMessage : '';
    });

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const stringValue = typeof e.target.value === 'string' ? e.target.value : String(e.target.value || '');
        setMessage(stringValue);
    };

    useEffect(() => {
        const stringMessage = typeof message === 'string' ? message : String(message || '');
        dispatch(updateMessage({id, fileType: "none", value: stringMessage}))
    }, [message, id, dispatch])

    return (
        <React.Fragment>

            <Handle type="source" position={Position.Right}  />

            <div className='p-1 text-xs'>
                
                <Input
                    id='message' 
                    name='message' 
                    onChange={handleMessageChange} 
                    value={message} 
                    type="text"
                    placeholder='Enter text here' />

            </div>

        </React.Fragment>
    )
}

export default React.memo(ButtonNode)