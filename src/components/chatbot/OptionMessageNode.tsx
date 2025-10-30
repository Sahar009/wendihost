import React, { useEffect, useState } from "react"
import Textarea from "../utils/Textarea"
import NodeWrapper from "./NodeWrapper"
import { Node } from "reactflow"
import { useDispatch } from "react-redux"
import { addNode, updateMessage } from "@/store/slices/chatbotBuilderSlice"
import { CUSTOM_NODE } from "@/libs/enums"
import LoadingButtonSM from "../utils/LoadingButtonSM"


interface IProps extends Node {

}

export const optionNodeProp: Node =  { 
    id: "dummy",
    parentNode: "node-3", 
    data: { message: ""},
    type: CUSTOM_NODE.OPTION_NODE, 
    position: { x: 0, y: 100 }, 
    draggable: false
}

const OptionMessageNode = (props: IProps) => {

    const { id, data } = props

    const parentNode = id

    const [lastPosition, setLastPosition] = useState(150)

    const dispatch = useDispatch()

    const [message, setMessage] = useState(() => {
        const initialMessage = data.message;
        return typeof initialMessage === 'string' ? initialMessage : '';
    });

    const handleMessageChange = (value: string) => {
        const stringValue = typeof value === 'string' ? value : String(value || '');
        setMessage(stringValue);
    };

    useEffect(() => {
        const stringMessage = typeof message === 'string' ? message : String(message || '');
        dispatch(updateMessage({id, fileType: "none", value: stringMessage}))
    }, [message, id, dispatch])

    const addOption = () => {
        const padding = 100 + 50 * Number(data?.children?.length)
        dispatch(addNode({...optionNodeProp, parentNode, position: { y: padding }}))
        setLastPosition(padding) 
    }

    useEffect(() => {   
        setLastPosition(50 + 50 * Number(data?.children?.length))
    }, [data.children?.length])


    return (
        <NodeWrapper id={id} header={<h4 className='text-gray-700 font-bold'>Create decision</h4>} hideOutput={true}>

            <div style={{height: lastPosition + 70}} className={`flex flex-col justify-between p-1 text-xs w-[230px]`}>
                <Textarea 
                    id='message' 
                    name='message' 
                    onChange={handleMessageChange} 
                    value={message} 
                    placeholder='Enter text here'
                    height={"60px"} />

                <div>
                    <LoadingButtonSM onClick={addOption}>Add Option</LoadingButtonSM>
                </div>    
            </div>

        </NodeWrapper>
    )
}

export default React.memo(OptionMessageNode)