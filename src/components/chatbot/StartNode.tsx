import { INodeFlowProps } from '@/libs/interfaces';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import ModalWrapper from '../utils/ModalWrapper';
import Input from '../auth/Input';
import useInput from '@/hooks/useInput';
import LoadingButton from '../utils/LoadingButton';
import { GripHorizontal } from "lucide-react"


const StartNode = (props: INodeFlowProps) => {


    return (
        <React.Fragment>
            <Handle type="source" position={Position.Right} />
            <div className='bg-white rounded-lg p-2 text-xs border-2 border-primary flex flex-col items-center min-w-[120px] min-h-[70px]'>
              
                <span className="flex flex-col items-center justify-center mt-1 mb-2">
                  <GripHorizontal size={20} className="text-primary" />
                </span>
                <h4 className='text-gray-700 font-bold'>Start</h4>
                {/* <p>
                    This is where your <br /> bot begins
                </p> */}
            </div>

        </React.Fragment>
    );
}


export default StartNode