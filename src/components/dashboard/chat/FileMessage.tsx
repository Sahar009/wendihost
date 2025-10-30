import { useState } from 'react';
import MessageBox from './MessageBox';
import EmojiBtn from '@/components/utils/EmojiBtn';
import { AiOutlineSend } from 'react-icons/ai';
import { toast } from 'react-toastify';
import axios, { AxiosResponse } from 'axios';
import { Conversation } from '@prisma/client';
import { ApiResponse } from '@/libs/types';
import { addMessage } from '@/store/slices/messageSlice';
import { useDispatch } from 'react-redux';
import { Oval } from 'react-loader-spinner';
import Image from 'next/image';
import { DUMMY_PHOTO } from '@/libs/constants';

interface UploadProps {
    accept?: string;
    workspaceId: number;
    conversation: Conversation;
    onUploadComplete?: (response: any) => void;
    onError?: (error: Error) => void;
    onClose: () => void;
}

const FileMessageModal: React.FC<UploadProps> = ({ workspaceId, accept, conversation, onClose, onError }) => {
    
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false)
    const [link, setLink] = useState("")
    const [message, setMessage] = useState("")

    const dispatch = useDispatch()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
       
        const files = event.target.files;
       
        if (!files?.length) return;

        try {
            
            setIsUploading(true);
        
            const formData = new FormData();

            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            const response = await fetch(`/api/${workspaceId}/uploads`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            setLink(data.data[0].url)
            //Todo: set Dummy image
            setLink(DUMMY_PHOTO)
        
        } catch (error) {
        
            onError?.(error as Error);
        
        } finally {
        
            setIsUploading(false);
        
        }
    
    };


    const sendMessage = async () => {

        setLoading(true)

        const body = { 
            chatId: conversation?.id, 
            message, 
            link, 
            fileType: "image" //Change when we support more fileTypes
        }

        try {
            const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chats/${conversation.phone}/send-file`, body)
            const data : ApiResponse = res?.data
            dispatch(addMessage(data?.data))
            setMessage("")
            setLink("")
            handleClose()
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }
        } 
        setLoading(false)
    }

    const handleClose = () => {
        onClose()
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }


    return (
        <div>

            <div>

                <div 
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = accept || '';
                        input.multiple = true;
                        input.style.display = 'none';
                        input.onchange = (e: Event) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
                        document.body.appendChild(input);
                        input.click();
                        document.body.removeChild(input);
                    }}
                    className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors md:h-[500px]">

                    <div className="text-center className='w-full md:w-[450px] md:h-[450px]'">
                        {
                            link ? (
                                <Image height={450} width={450} className='w-full md:w-[450px] h-auto' src={link} alt="Upload"   />
                            ) : (
                                <div className='w-full md:w-[450px] h-auto'>
                                    <svg className="mx-auto h-60 w-60 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Click to upload
                                    </p>
                                </div>
                            )
                        }

                    </div>

                </div>

                {isUploading && <p>Uploading...</p>}

                <div>

                    <div className="flex items-center bg-[#f0f2f5] px-4 py-3">

                        <div className="flex-1 flex items-center bg-white rounded-lg px-4 h-12">
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                rows={1}
                                placeholder={"Type a message"}
                                className="w-full py-2 px-2 outline-none resize-none max-h-32 min-h-[40px]"
                            />
                            <EmojiBtn onEmojiClick={(emoji: string) => setMessage((value: string) => value + emoji)} />
                        </div>

                        <button 
                            disabled={loading} 
                            onClick={sendMessage}
                            className="ml-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:bg-gray-300 disabled:cursor-not-allowed text-white">
                            {!loading ? (
                                <AiOutlineSend size={24} />
                            ) : (
                                <Oval height="20" width="20" color="#ffffff" />
                            )}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};


export default FileMessageModal