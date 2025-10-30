import axios, { AxiosResponse } from 'axios';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Popover } from 'react-tiny-popover'
import { AiOutlinePlus, AiOutlineSend } from 'react-icons/ai';
import useSWR from 'swr'
import { Conversation, Snippet} from '@prisma/client';
import { ApiResponse } from '@/libs/types';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, fetchMessages } from '@/store/slices/messageSlice';
import { Oval } from "react-loader-spinner";
import ModalWrapper from '@/components/utils/ModalWrapper';
import { toast } from 'react-toastify';
import TemplatePreprocessor from '../template/TemplatePreprocessor';
import EmojiBtn from '@/components/utils/EmojiBtn';
import FileMessageModal from './FileMessage';
import { getCurrentWorkspace } from '@/store/slices/system';


interface IProps {
    conversation: Conversation
}

const MessageBox = (props: IProps) => {

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const { conversation } = props

    const dispatch = useDispatch()

    const messages = useSelector(fetchMessages)

    const getSnippets = useSWR(`/api/${workspaceId}/snippets/get?page=${1}`, axios)

    const [loading, setLoading] = useState(false)
    const [snippets, setSnippets] = useState<Snippet[]>([])
    const [message, setMessage] = useState("")
    const [showTemplate, setShowTemplate] = useState(false)
    const [showFileUpload, setShowFileUpload] = useState(false)
    const [canSendText, setCanSendText] = useState(false)
    let showSnippet = false

    const read = useCallback(async() => {
        if (conversation?.read === false) {
            const body = {
                chatId: conversation.id
            }
            await axios.post(`/api/${workspaceId}/chats/${conversation?.phone}/read`, body)
        }
    }, [conversation, workspaceId])

    useEffect(() => {
        const res = getSnippets?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) setSnippets(data?.data)
    }, [getSnippets])


    useEffect(() => {
        read()
    }, [read])


    useEffect(() => {
        const length = messages.length
        const lastMsgTime = Number(new Date(messages?.[length - 1]?.createdAt)) + (24 * 3600000)
        const currentTime = Date.now() 

        if (length > 0 && lastMsgTime > currentTime) {
            setCanSendText(true)
        } else {
            setCanSendText(false)
        }
    }, [messages])

    if (message[message.length - 1] === "/") showSnippet = true
    else showSnippet = false

    const addSnippet = (snippet: string) => {
        setMessage(s => s.slice(0, s.length - 1) + snippet)
    }

    const sendMessage = async (p0?: (value: string) => string) => {
        if (!message.trim()) return

        setLoading(true)
        setMessage("")

        const body = { chatId: conversation?.id, message }

        try {
            const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chats/${conversation.phone}/message`, body)
            const data : ApiResponse = res?.data
            dispatch(addMessage(data?.data))
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }
        }

        setLoading(false)
    }

    const handleBoxClick = () => {
        if (!canSendText) setShowTemplate(true)
    }

    const handleClose = () => {
        setShowTemplate(false)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            <div className='h-20 flex justify-center w-full'>
                <Popover
                    isOpen={showSnippet}
                    positions={['top', 'bottom', 'left', 'right']}
                    content={(
                        <div className='bg-white shadow-lg rounded-lg p-3'>
                            <ul className='space-y-2'>
                                {snippets.map((snippet, index) => (
                                    <li 
                                        onClick={() => addSnippet(snippet.body)} 
                                        className='cursor-pointer hover:bg-gray-100 p-2 rounded' 
                                        key={index}
                                    >
                                        <span className='font-medium'>{snippet.name}</span>
                                        <span className='text-gray-600 ml-2'>{snippet.body}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                >
                    <div></div>
                </Popover>
            </div>

            <div className="flex items-center bg-[#f0f2f5] px-4 py-3">

                <button 
                    onClick={() => setShowFileUpload(true)}
                    className="mx-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:bg-gray-300 disabled:cursor-not-allowed text-white">
                    <AiOutlinePlus size={24} />
                </button>

                <div className="flex-1 flex items-center bg-white rounded-lg px-4 h-12">
                    <textarea 
                        onClick={handleBoxClick}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={1}
                        placeholder={canSendText ? "Type a message" : "You need to send a template message first"}
                        className="w-full py-2 px-2 outline-none resize-none max-h-32 min-h-[40px]"
                    />
                    <EmojiBtn onEmojiClick={(emoji: string) => setMessage((value: string) => value + emoji)} />
                </div>

                <button 
                    disabled={loading || (!message.trim() && canSendText)} 
                    onClick={() => sendMessage()}
                    className="ml-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:bg-gray-300 disabled:cursor-not-allowed text-white">
                    {!loading ? (
                        <AiOutlineSend size={24} />
                    ) : (
                        <Oval height="20" width="20" color="#ffffff" />
                    )}
                </button>
            </div>


            <ModalWrapper title='Choose Message Template' open={showTemplate} handleClose={handleClose} lg={true}>
                <TemplatePreprocessor 
                    conversation={conversation}
                    isBroadcast={false}
                    selectedContacts={[]}
                    tags={[]}
                    handleClose={handleClose}
                    refresh={() => {}}
                />
            </ModalWrapper>

            <ModalWrapper title='Send File' open={showFileUpload} handleClose={() => setShowFileUpload(false)} lg={true}>
                <FileMessageModal 
                    accept='image/*' 
                    workspaceId={workspaceId} 
                    conversation={conversation} 
                    onClose={() => setShowFileUpload(false)} />
            </ModalWrapper>
        </>
    )
}

export default MessageBox
