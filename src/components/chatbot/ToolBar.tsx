import React from "react"
import { useDispatch, useSelector } from "react-redux"
import LoadingButtonSM from "../utils/LoadingButtonSM"
import { Edge, Node } from "reactflow"
import { addNode } from "@/store/slices/chatbotBuilderSlice"
import { CUSTOM_NODE } from "@/libs/enums"
import { generateChatbot } from "@/libs/utils"
import axios, { AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { ApiResponse } from "@/libs/types"
import { useState, useRef, useEffect } from "react"
import ModalWrapper from "../utils/ModalWrapper"
import Input from "../auth/Input"
import LoadingButton from "../utils/LoadingButton"
import { getCurrentWorkspace } from "@/store/slices/system"
import { ChevronDown, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"

const child: Node = {
    id: "dummy",
    type: 'optionNode',
    position: { x: 0, y: 160 },
    data: {
        message: "",
        children: []
    }
}

interface IProps {
    nodes: Node[];
    edges: Edge[];
    botId: number;
    name: string;
    onNameChange?: (name: string) => void;
    trigger: string;
    onTriggerChange?: (trigger: string) => void;
    publish?: boolean;
    onPublishChange?: (publish: boolean) => void;
    onRefresh?: () => void;
}

const Toolbar = (props: IProps) => {
    const { nodes, edges, botId } = props
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)
    const [editingType, setEditingType] = useState<'name' | 'trigger'>('name')
    const { id: workspaceId } = useSelector(getCurrentWorkspace)
    const dispatch = useDispatch()
    const [addFlowOpen, setAddFlowOpen] = useState(false)
    const addFlowRef = useRef<HTMLDivElement>(null);
    useClickOutside(addFlowRef, () => setAddFlowOpen(false));
    const [botName, setBotName] = useState(props.name);
    const [botTrigger, setBotTrigger] = useState(props.trigger);
    const [isPublished, setIsPublished] = useState(props.publish || false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const router = useRouter()
    
    // Track changes in nodes and edges
    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [nodes, edges]);
    
    // Sync local state with props
    useEffect(() => {
        setBotName(props.name);
        setBotTrigger(props.trigger);
        setIsPublished(props.publish || false);
    }, [props.name, props.trigger, props.publish]);
    
    const handleClose = () => setOpen(false)

    const openNameEditor = () => {
        setEditingType('name');
        setOpen(true);
    }

    const openTriggerEditor = () => {
        setEditingType('trigger');
        setOpen(true);
    }

    const saveChanges = async () => {
        try {
            setSaving(true);
            
            const response = await axios.put(`/api/${workspaceId}/chatbot/${botId}/update`, {
                name: editingType === 'name' ? botName : undefined,
                trigger: editingType === 'trigger' ? botTrigger : undefined
            });

            if (response.data.status === 'success') {
                if (editingType === 'name' && props.onNameChange) {
                    props.onNameChange(botName);
                }
                if (editingType === 'trigger' && props.onTriggerChange) {
                    props.onTriggerChange(botTrigger);
                }
                
                toast.success(response.data.message || 'Updated successfully');
                setOpen(false);
            } else {
                toast.error(response.data.message || 'Failed to update');
            }
        } catch (error: any) {
            console.error('Error updating chatbot:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update chatbot';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    }

    const messageReply = () => dispatch(addNode({ ...child, type: CUSTOM_NODE.MESSAGE_REPLY_NODE }))
    const optionMessage = () => dispatch(addNode({ ...child, type: CUSTOM_NODE.OPTION_MESSAGE_NODE }))
    const buttonMessage = () => dispatch(addNode({ ...child, type: CUSTOM_NODE.BUTTON_MESSAGE_NODE }))
    const chatWithAgent = () => dispatch(addNode({ ...child, type: CUSTOM_NODE.CHAT_WITH_AGENT }))
    const chatBotMsg = () => dispatch(addNode({
        ...child,
        type: CUSTOM_NODE.CHAT_BOT_MSG_NODE,
        data: {
            ...child.data,
            fileType: 'none',
            text: '',
            link: null,
        }
    }))

    const save = async (publish = false, bot: any = null) => {
        try {
            setSaving(true)
            
            // Generate bot configuration from nodes and edges
            const generatedBot = bot || generateChatbot(nodes, edges)
            
            const body = { nodes, edges, publish, bot: generatedBot }
            const res: AxiosResponse = await axios.post(`/api/${workspaceId}/chatbot/${botId}/save`, body)
            const data: ApiResponse = res?.data
            
            if (data.status === 'success') {
                toast.success(data.message || 'Saved successfully')
                setHasUnsavedChanges(false)
                
                // Update publish status if it was changed
                if (publish !== undefined) {
                    setIsPublished(Boolean(publish))
                    if (props.onPublishChange) {
                        props.onPublishChange(Boolean(publish))
                    }
                }
                
                // Refresh the chatbot data to get updated publish status
                if (props.onRefresh) {
                    props.onRefresh()
                }
            } else {
                toast.error(data.message || 'Failed to save')
            }
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message || 'Failed to save chatbot')
            } else {
                console.error(e)
                toast.error('An unexpected error occurred')
            }
        } finally {
            setSaving(false)
        }
    }

    const updateTrigger = async (newTrigger: string) => {
        try {
            const body = { trigger: newTrigger }
            const res: AxiosResponse = await axios.post(`/api/${workspaceId}/chatbot/${botId}/save-trigger`, body)
            const data: ApiResponse = res?.data
            toast.success(data.message)
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e)
            }
        }
    }

    const togglePublish = async () => {
        setSaving(true)
        try {
            const response = await axios.put(`/api/${workspaceId}/chatbot/${botId}/toggle-publish`);
            
            if (response.data.status === 'success') {
                const newPublishStatus = !isPublished;
                setIsPublished(newPublishStatus);
                if (props.onPublishChange) {
                    props.onPublishChange(newPublishStatus);
                }
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || 'Failed to toggle publish status');
            }
        } catch (error: any) {
            console.error('Error toggling publish status:', error);
            const errorMessage = error.response?.data?.message || 'Failed to toggle publish status';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    }



    function useClickOutside(ref: React.RefObject<HTMLElement>, callback: () => void) {
        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (ref.current && event.target && !ref.current.contains(event.target as HTMLElement)) {
                    callback();
                }
            }

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [ref, callback]);
    }


    return (
        <>
            <div className="flex items-center justify-between mb-4">

                <div className="flex items-center gap-3 bg-white p-3 rounded-full shadow-lg border">
                    {/* Bot Name Editor */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Name:</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-transparent outline-none px-2 py-1 rounded text-base font-medium">
                                    {botName}
                                </span>
                                {hasUnsavedChanges && (
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes"></div>
                                )}
                            </div>
                            <button 
                                onClick={openNameEditor}
                                className="hover:bg-gray-100 rounded p-1 transition-colors"
                                title="Edit bot name"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Trigger Editor */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Trigger:</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-transparent outline-none px-2 py-1 rounded text-sm font-medium">
                                {botTrigger || 'Set trigger...'}
                            </span>
                            <button 
                                onClick={openTriggerEditor}
                                className="hover:bg-gray-100 rounded p-1 transition-colors"
                                title="Edit bot trigger"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Publish Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Status:</span>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isPublished 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-2 ml-2">
                        <div ref={addFlowRef} className="relative">
                            <button
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full border border-blue-200 hover:bg-blue-600 transition"
                                onClick={() => setAddFlowOpen(!addFlowOpen)}
                            >
                                Add flow <ChevronDown size={16} className={`transition-transform ${addFlowOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {addFlowOpen && (
                                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                    <button
                                        onClick={() => { messageReply(); setAddFlowOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Message Reply
                                    </button>
                                    <button
                                        onClick={() => { optionMessage(); setAddFlowOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        Option Message
                                    </button>
                                    <button
                                        onClick={() => { buttonMessage(); setAddFlowOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        Button Message
                                    </button>
                                    <button
                                        onClick={() => { chatWithAgent(); setAddFlowOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        Chat with Agent
                                    </button>
                                    <button
                                        onClick={() => { chatBotMsg(); setAddFlowOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        Message with Upload
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right: Save and Publish/Unpublish buttons */}
                <div className="flex items-center gap-2">
                    <LoadingButtonSM
                        loading={saving}
                        onClick={() => save(false)}
                        className={`transition-all hover:scale-105 px-6 text-base font-semibold rounded-full border ${
                            hasUnsavedChanges 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Save
                    </LoadingButtonSM>
                    <LoadingButtonSM
                        loading={saving}
                        onClick={() => isPublished ? togglePublish() : save(true)}
                        className={`transition-all hover:scale-105 px-6 text-base font-semibold rounded-full border-none ${
                            isPublished 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        {isPublished ? 'Unpublish' : 'Publish'}
                    </LoadingButtonSM>
                </div>
            </div>

            {/* Modal for editing name or trigger */}
            <ModalWrapper
                title={editingType === 'name' ? 'Edit Bot Name' : 'Edit Bot Trigger'}
                open={open}
                handleClose={handleClose}
                className="bg-white rounded-lg shadow-2xl"
            >
                <div className="p-6">
                    {editingType === 'name' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bot Name
                                </label>
                                <Input
                                    type="text"
                                    value={botName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotName(e.target.value)}
                                    placeholder="Enter bot name"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bot Trigger
                                </label>
                                <Input
                                    type="text"
                                    value={botTrigger}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotTrigger(e.target.value)}
                                    placeholder="E.g., /start, hello, menu"
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This is the command users will type to activate the chatbot
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-3 mt-6">
                        <LoadingButton
                            loading={saving}
                            onClick={saveChanges}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </LoadingButton>
                        <LoadingButton
                            onClick={handleClose}
                            disabled={saving}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
                        >
                            Cancel
                        </LoadingButton>
                    </div>
                </div>
            </ModalWrapper>
        </>
    )
}

export default React.memo(Toolbar)