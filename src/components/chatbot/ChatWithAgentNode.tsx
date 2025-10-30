import { INodeFlowProps } from '@/libs/interfaces';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import ModalWrapper from '../utils/ModalWrapper';
import Input from '../auth/Input';
import useInput from '@/hooks/useInput';
import LoadingButton from '../utils/LoadingButton';
import { AiFillDelete } from 'react-icons/ai';
import { useDispatch } from 'react-redux';
import { removeNode, updateMessage } from '@/store/slices/chatbotBuilderSlice';
import Textarea from '../utils/Textarea';
import NodeWrapper from './NodeWrapper'


interface IProps {
    id: string
    data: {
        message: string
    }
}

const ChatWithAgentNode = (props: IProps) => {

    const { id, data } = props

    const dispatch = useDispatch()

    const [message, setMessage] = useState(() => {
        const initialMessage = data.message || "";
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

    const deleteNode = () => {
        dispatch(removeNode(id))
    }

    return (
        <NodeWrapper id={id} header={<h4 className='text-gray-700 font-bold'>Agent</h4>}>
            <p>This open a chat with agent </p>
            <div className='p-1 text-xs bg-slate-300'>
                <Textarea 
                    id='message' 
                    name='message' 
                    onChange={handleMessageChange} 
                    value={message} 
                    placeholder='Enter text here' 
                    height='80px'
                />
            </div>
        </NodeWrapper>
    );
}


export default ChatWithAgentNode