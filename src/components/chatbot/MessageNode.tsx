import { INodeFlowProps } from '@/libs/interfaces';
import React, { useEffect, useState } from 'react';
import { Handle, Node, Position } from 'reactflow';
import NodeWrapper from './NodeWrapper';
import { useDispatch } from 'react-redux';
import { updateMessage } from '@/store/slices/chatbotBuilderSlice';
import { ChatFormatType } from '@/libs/types';

interface IProps extends Node {
    data: {
        message: string;
        fileType: string;
        link: string | null;
    }
}

const MessageNode = (props: IProps) => {

    const { id, data } = props

    const { message, fileType, link } = data

    const dispatch = useDispatch()

    const [textValue, setTextValue] = useState<string>(typeof message === 'string' ? message : String(message || ''));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const safeText = typeof textValue === 'string' ? textValue : String(textValue || '');
        
        dispatch(updateMessage({
            id, 
            value: safeText, 
            fileType: "none", // Message nodes only handle text
            link: null // No links for text-only messages
        }));
    }, [textValue, id, dispatch])

    return (
        <NodeWrapper
            id={id}
            header={
                <h4 className='text-gray-700 font-bold'>Text Message</h4>
            }
            onEdit={() => setEditing((e) => !e)}
        >
            <div className='p-1 text-xs'>
                {editing ? (
                    <div className="space-y-2">
                        <textarea
                            value={textValue}
                            onChange={(e) => setTextValue(e.target.value)}
                            placeholder="Enter your message text here..."
                            className="w-full min-h-[80px] text-xs p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="text-xs text-gray-500">
                            This node sends a text message to the user
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="font-semibold mb-1 break-words max-w-[220px] rounded-b-lg">
                            {textValue || 'Enter message text here...'}
                        </div>
                        <div className="text-xs text-gray-400">
                            Text message node
                        </div>
                    </div>
                )}
            </div>
        </NodeWrapper>
    );

}

export default MessageNode