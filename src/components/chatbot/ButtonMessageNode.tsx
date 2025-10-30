import React, { useEffect, useState } from "react"
import Textarea from "../utils/Textarea"
import NodeWrapper from "./NodeWrapper"
import { Node } from "reactflow"
import { useDispatch } from "react-redux"
import { addNode, updateMessage } from "@/store/slices/chatbotBuilderSlice"
import { CUSTOM_NODE } from "@/libs/enums"
import LoadingButtonSM from "../utils/LoadingButtonSM"
import { toast } from "react-toastify"


interface IProps extends Node {

}

export const buttonNodeProp: Node =  { 
    id: "dummy",
    parentNode: "node-3", 
    data: { message: "", buttons: [] },
    type: CUSTOM_NODE.BUTTON_NODE, 
    position: { x: 0, y: 100 }, 
    draggable: false
}

const ButtonMessageNode = (props: IProps) => {

    const { id, data } = props

    const parentNode = id

    const [lastPosition, setLastPosition] = useState(150)

    const dispatch = useDispatch()

    const [message, setMessage] = useState(() => {
        const initialMessage = data.message || "";
        return typeof initialMessage === 'string' ? initialMessage : '';
    });

    const handleMessageChange = (value: string) => {
        // Ensure we only pass primitive string values
        const stringValue = typeof value === 'string' ? value : String(value || '');
        setMessage(stringValue);
    };

    useEffect(() => {
        // Ensure we only dispatch primitive values to Redux
        const stringMessage = typeof message === 'string' ? message : String(message || '');
        dispatch(updateMessage({id, fileType: "none", value: stringMessage}))
    }, [message, id, dispatch])

    const addButton = () => {
        if (data?.children?.length >= 3) return toast.error("You can only add 3 buttons")
        const padding = 100 + 50 * Number(data?.children?.length)
        dispatch(addNode({...buttonNodeProp, parentNode, position: { y: padding }}))
        setLastPosition(padding) 
    }

    useEffect(() => {   
        setLastPosition(50 + 50 * Number(data?.children?.length))
    }, [data.children?.length])

    return (
        <NodeWrapper id={id} header={<h4 className='text-gray-700 font-bold'>Button Message</h4>} hideOutput={true}>

            <div style={{height: lastPosition + 70}} className={`flex flex-col justify-between p-1 text-xs w-[230px]`}>
                <Textarea 
                    id='message' 
                    name='message' 
                    onChange={handleMessageChange} 
                    value={message} 
                    placeholder='Enter text here'
                    height={"60px"} />

                <div>
                    <LoadingButtonSM disabled={data?.children?.length >= 3} onClick={addButton}>Add Button</LoadingButtonSM>
                </div>    
                
            </div>

        </NodeWrapper>
    )
}

export default React.memo(ButtonMessageNode)