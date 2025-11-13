import React, { ReactNode, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import {Pencil,Trash2, GripHorizontal, Copy} from "lucide-react"
import { getEdges, removeNode, duplicateNode } from '@/store/slices/chatbotBuilderSlice';

interface IProps {
    id: string,
    children: React.ReactNode,
    header?: React.ReactNode,
    hideOutput?: boolean,
    onEdit?: () => void,
}

const NodeWrapper = (props: IProps) => {

    const dispatch = useDispatch()

    const { id, header, hideOutput, onEdit } = props

    const deleteNode = () => {
        dispatch(removeNode(id))
    }

    const handleDuplicate = () => {
        dispatch(duplicateNode(id))
    }

    const onConnect = (params: any) => {
        console.log('handle onConnect', params)
    }

    return (
        <React.Fragment>

            {   
                !hideOutput &&  
                    <Handle 
                        type="source" 
                        position={Position.Right}  
                        onConnect={onConnect}
                        />     
            }

            <Handle type="target" position={Position.Left} />

            <div className='rounded-lg border-2 border-primary p-0 bg-white flex flex-col'>
                <span className="flex flex-col items-center justify-center mt-2 mb-2">
                    <GripHorizontal size={20} className="text-primary" />
                </span>
                <div className='flex flex-col items-center p-4 pb-2 rounded-b-lg'>
                    {header}
                    <div className='w-full'>{props.children}</div>
                </div>
                <div className="flex  gap-4 bg-primary rounded-b-lg py-2 p-2">
                    {onEdit && <button onClick={onEdit}><Pencil size={24} color='white' /></button>}
                    <button onClick={handleDuplicate} title="Duplicate node"><Copy size={24} color='white' /></button>
                    <button onClick={deleteNode}><Trash2 size={24} color='white' /></button>
                </div>
            </div>
        
        </React.Fragment>
    );

}

export default NodeWrapper