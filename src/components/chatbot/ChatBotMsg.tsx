import { Upload } from "./Upload"
import { useEffect, useState } from "react"
import useInput from "@/hooks/useInput"
import TextInput from "./TextInput"
import { DUMMY_PHOTO } from "@/libs/constants"
import { useSelector } from "react-redux"
import { getCurrentWorkspace } from "@/store/slices/system"
import { 
    Type, 
    Image, 
    Video, 
    Headphones, 
    FileText, 
    Network, 
    MapPin, 
    MousePointer, 
    Zap, 
    Link, 
    Palette, 
    X,
    Trash2
} from "lucide-react"
import NextImage from 'next/image';

export type FileTypeValue = 'none' | 'image' | 'video' | 'audio';

export interface IMsgValue {
    fileType: FileTypeValue;
    text: string | null;
    link: string | null;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
        name?: string;
    } | null;
    cta?: {
        buttonText: string;
        url: string;
        style?: 'primary' | 'secondary' | 'outline';
    } | null;
    api?: {
        endpoint: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        headers?: Record<string, string>;
        body?: string;
        description?: string;
    } | null;
    condition?: {
        field: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
        value: string;
        description?: string;
    } | null;
    interactive?: {
        chatbotId: number;
        chatbotName: string;
        description?: string;
    } | null;
    template?: {
        templateId: string;
        templateName: string;
        category: string;
        language: string;
        status: string;
        description?: string;
    } | null;
}

interface IChatBotMsg {
    value?: Partial<IMsgValue>;
    setValue?: (value: IMsgValue) => void;
}

const DEFAULT_VALUES: IMsgValue = {
    fileType: 'none',
    text: '',
    link: null,
    location: null,
    cta: null,
    api: null,
    condition: null,
    interactive: null,
    template: null
};

const FILE_TYPE_OPTIONS = [
    { id: 'text', label: 'Text', icon: Type, fileType: 'none' as FileTypeValue },
    { id: 'image', label: 'Image', icon: Image, fileType: 'image' as FileTypeValue },
    { id: 'video', label: 'Video', icon: Video, fileType: 'video' as FileTypeValue },
    { id: 'audio', label: 'Audio', icon: Headphones, fileType: 'audio' as FileTypeValue },
    { id: 'file', label: 'File', icon: FileText, fileType: 'none' as FileTypeValue },
    { id: 'interactive', label: 'Chatbot', icon: Network, fileType: 'none' as FileTypeValue },
    { id: 'maps', label: 'Maps', icon: MapPin, fileType: 'none' as FileTypeValue },
    { id: 'cta', label: 'CTA URL Button', icon: MousePointer, fileType: 'none' as FileTypeValue },
    { id: 'api', label: 'HTTP API', icon: Zap, fileType: 'none' as FileTypeValue },
    { id: 'template', label: 'Template Message', icon: Palette, fileType: 'none' as FileTypeValue },
];

const ChatBotMsg = ({ value = {}, setValue = () => {} }: IChatBotMsg) => {
    const { id: workspaceId } = useSelector(getCurrentWorkspace);
    
    console.log('ChatBotMsg: Received value prop:', value);
    
    const [state, setState] = useState<IMsgValue>({ ...DEFAULT_VALUES, ...value });
    
    const caption = useInput("text", 1, state.text || '');
    
    const inferInitialType = () => {
        // First check if there's an explicit fileType set
        if (state.fileType && state.fileType !== 'none') {
            switch (state.fileType) {
                case 'image': return 'image';
                case 'video': return 'video';
                case 'audio': return 'audio';
            }
        }
        
        // Check for specific content types
        if (state.location) return 'maps';
        if (state.cta) return 'cta';
        if (state.api) return 'api';
        if (state.interactive) return 'interactive';
        if (state.template) return 'template';
        
        // Check for file links (including Cloudinary)
        if (state.link) {
            const url = state.link.toLowerCase();
            
            // Handle Cloudinary URLs - extract format from URL
            if (url.includes('cloudinary.com')) {
                // Cloudinary URLs often have format in the path
                if (url.includes('/image/') || url.includes('/f_auto/')) return 'image';
                if (url.includes('/video/') || url.includes('/f_mp4/')) return 'video';
                if (url.includes('/audio/') || url.includes('/f_mp3/')) return 'audio';
                
                // Check file extension in Cloudinary URL
                const extension = url.split('.').pop()?.split('?')[0]; // Remove query params
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) return 'image';
                if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'].includes(extension || '')) return 'video';
                if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension || '')) return 'audio';
                
                // Default to file if we can't determine
                return 'file';
            }
            
            // Handle regular URLs
            const extension = url.split('.').pop()?.split('?')[0]; // Remove query params
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) return 'image';
            if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'].includes(extension || '')) return 'video';
            if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension || '')) return 'audio';
            
            // If it has an extension but we don't recognize it, treat as file
            if (extension && extension.length <= 5) return 'file';
        }
        
        // Default to text
        return 'text';
    };
    const [selectedFileType, setSelectedFileType] = useState<string>(inferInitialType());
    
    console.log('ChatBotMsg: Initial selectedFileType:', selectedFileType);
    console.log('ChatBotMsg: Current state:', state);
    
    const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
    const [showMapSelector, setShowMapSelector] = useState(false);
    const [showCtaConfig, setShowCtaConfig] = useState(false);
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [showConditionConfig, setShowConditionConfig] = useState(false);
    const [showInteractiveConfig, setShowInteractiveConfig] = useState(false);
    const [chatbots, setChatbots] = useState<Array<{ id: number; name: string; trigger: string; default: boolean; publish: boolean; createdAt: string }>>([]);
    const [loadingChatbots, setLoadingChatbots] = useState(false);
    const [showTemplateConfig, setShowTemplateConfig] = useState(false);
    const [templates, setTemplates] = useState<Array<{ id: string; name: string; category: string; language: string; status: string; components?: any[] }>>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const currentOption = FILE_TYPE_OPTIONS.find(option => option.id === selectedFileType) || FILE_TYPE_OPTIONS[0];

    const fetchChatbots = async () => {
        if (!workspaceId) return;
        
        setLoadingChatbots(true);
        try {
            const response = await fetch(`/api/${workspaceId}/chatbot/list`);
            const data = await response.json();
            if (data.status === 'success') {
                setChatbots(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching chatbots:', error);
        } finally {
            setLoadingChatbots(false);
        }
    };

    const fetchTemplates = async () => {
        if (!workspaceId) return;
        
        setLoadingTemplates(true);
        try {
            const response = await fetch(`/api/${workspaceId}/template/get`);
            const data = await response.json();
            if (data.status === 'success') {
                setTemplates(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        if (!setValue) return;
        const next = {
            fileType: currentOption.fileType,
            text: caption.value.toString(),
            link: state.link,
            location: state.location,
            cta: state.cta,
            api: state.api,
            condition: state.condition,
            interactive: state.interactive,
            template: state.template,
        } as IMsgValue;
        const prev = (value as IMsgValue) || DEFAULT_VALUES;
        const changed =
            next.fileType !== prev.fileType ||
            (next.text || '') !== (prev.text || '') ||
            (next.link || '') !== (prev.link || '') ||
            JSON.stringify(next.location) !== JSON.stringify(prev.location) ||
            JSON.stringify(next.cta) !== JSON.stringify(prev.cta) ||
            JSON.stringify(next.api) !== JSON.stringify(prev.api) ||
            JSON.stringify(next.condition) !== JSON.stringify(prev.condition) ||
            JSON.stringify(next.interactive) !== JSON.stringify(prev.interactive) ||
            JSON.stringify(next.template) !== JSON.stringify(prev.template);
        if (changed) {
            console.log('ChatBotMsg: State changed, calling setValue with:', next);
            console.log('ChatBotMsg: Previous value was:', prev);
            console.log('ChatBotMsg: What changed:', {
                fileType: next.fileType !== prev.fileType,
                text: (next.text || '') !== (prev.text || ''),
                link: (next.link || '') !== (prev.link || ''),
                location: JSON.stringify(next.location) !== JSON.stringify(prev.location),
                cta: JSON.stringify(next.cta) !== JSON.stringify(prev.cta),
                api: JSON.stringify(next.api) !== JSON.stringify(prev.api),
                condition: JSON.stringify(next.condition) !== JSON.stringify(prev.condition),
                interactive: JSON.stringify(next.interactive) !== JSON.stringify(prev.interactive),
                template: JSON.stringify(next.template) !== JSON.stringify(prev.template),
            });
            setValue(next);
        }
    }, [selectedFileType, caption.value, state.link, state.location, state.cta, state.api, state.condition, state.interactive, state.template, setValue, currentOption.fileType]);

    useEffect(() => {
        if (showInteractiveConfig && chatbots.length === 0) {
            fetchChatbots();
        }
    }, [showInteractiveConfig]);

    useEffect(() => {
        if (showTemplateConfig && templates.length === 0) {
            fetchTemplates();
        }
    }, [showTemplateConfig]);

    useEffect(() => {
        const newType = inferInitialType();
        console.log('ChatBotMsg: useEffect - value changed, inferring new type:', newType, 'current:', selectedFileType);
        if (newType !== selectedFileType) {
            console.log('ChatBotMsg: Updating selectedFileType from', selectedFileType, 'to', newType);
            setSelectedFileType(newType);
        }
    }, [value]);

    useEffect(() => {
        if (['image', 'video', 'audio'].includes(selectedFileType)) {
            setState(prev => ({
                ...prev,
                fileType: selectedFileType as FileTypeValue
            }));
        }
    }, [selectedFileType]);

    useEffect(() => {
        console.log('ChatBotMsg: useEffect - value.text changed:', value.text, 'current caption:', caption.value.toString());
        if (value.text && value.text !== caption.value.toString()) {
            console.log('ChatBotMsg: Updating caption input from', caption.value.toString(), 'to', value.text);
            caption.setValue(value.text);
        }
    }, [value.text]);

    const handleUploadComplete = (data: any) => {
        const url = data?.data?.[0]?.url || DUMMY_PHOTO;
        setState(prev => ({ ...prev, link: url }));
    };

    const handleFileTypeSelect = (fileTypeId: string) => {
        setSelectedFileType(fileTypeId);
        
        setState(prev => {
            const newState = { ...prev };
            
                if (['image', 'video', 'audio'].includes(fileTypeId)) {
                    newState.fileType = fileTypeId as FileTypeValue;
            } else {
                    newState.fileType = 'none' as FileTypeValue;
            }
            
            // Clear file-related values when switching away from file types
            if (!['image', 'video', 'audio', 'file'].includes(fileTypeId)) {
                newState.link = null;
            }
            
            // Clear text when switching away from text type
            if (fileTypeId !== 'text') {
                newState.text = '';
            }
            
            // Clear location when switching away from maps
            if (fileTypeId !== 'maps') {
                newState.location = null;
            }
            
            // Clear CTA when switching away from CTA
            if (fileTypeId !== 'cta') {
                newState.cta = null;
            }
            
            // Clear API when switching away from API
            if (fileTypeId !== 'api') {
                newState.api = null;
            }
            
            // Clear interactive when switching away from interactive
            if (fileTypeId !== 'interactive') {
                newState.interactive = null;
            }
            
            // Clear template when switching away from template
            if (fileTypeId !== 'template') {
                newState.template = null;
            }
            
            return newState;
        });
        
        setShowFileTypeMenu(false);
    };

    const handleLocationSelect = (location: { latitude: number; longitude: number; address: string; name?: string }) => {
        setState(prev => ({ ...prev, location }));
        setShowMapSelector(false);
    };

    const handleRemoveLocation = () => {
        setState(prev => ({ ...prev, location: null }));
    };

    const handleCtaUpdate = (cta: { buttonText: string; url: string; style?: 'primary' | 'secondary' | 'outline' }) => {
        setState(prev => ({ ...prev, cta }));
        setShowCtaConfig(false);
    };

    const handleRemoveCta = () => {
        setState(prev => ({ ...prev, cta: null }));
    };

    const handleApiUpdate = (api: { endpoint: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; headers?: Record<string, string>; body?: string; description?: string }) => {
        setState(prev => ({ ...prev, api }));
        setShowApiConfig(false);
    };

    const handleRemoveApi = () => {
        setState(prev => ({ ...prev, api: null }));
    };

    const handleConditionUpdate = (condition: { field: string; operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists'; value: string; description?: string }) => {
        setState(prev => ({ ...prev, condition }));
        setShowConditionConfig(false);
    };

    const handleRemoveCondition = () => {
        setState(prev => ({ ...prev, condition: null }));
    };

    const handleInteractiveUpdate = (interactive: { chatbotId: number; chatbotName: string; description?: string }) => {
        setState(prev => ({ ...prev, interactive }));
        setShowInteractiveConfig(false);
    };

    const handleRemoveInteractive = () => {
        setState(prev => ({ ...prev, interactive: null }));
    };

    const handleTemplateUpdate = (template: { templateId: string; templateName: string; category: string; language: string; status: string; description?: string }) => {
        setState(prev => ({ ...prev, template }));
        setShowTemplateConfig(false);
    };

    const handleRemoveTemplate = () => {
        setState(prev => ({ ...prev, template: null }));
    };

    const getAcceptTypes = () => {
        switch (selectedFileType) {
            case 'image': return 'image/*';
            case 'video': return 'video/*';
            case 'audio': return 'audio/*';
            case 'file': return '*/*';
            default: return '';
        }
    };

    const getFileNameFromUrl = (url: string) => {
        try {
            // Handle Cloudinary URLs
            if (url.includes('cloudinary.com')) {
                // Extract filename from Cloudinary URL
                const urlObj = new URL(url);
                const pathSegments = urlObj.pathname.split('/');
                const filename = pathSegments[pathSegments.length - 1];
                // Remove any query parameters and get clean filename
                const cleanFilename = filename.split('?')[0];
                return cleanFilename.length > 20 ? cleanFilename.substring(0, 17) + '...' : cleanFilename;
            }
            
            // Handle local uploads (fallback)
            if (url.startsWith('/')) {
                const pathSegments = url.split('/');
                const filename = pathSegments[pathSegments.length - 1];
                return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
            }
            
            // Handle absolute URLs
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            const filename = pathSegments[pathSegments.length - 1];
            return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
        } catch {
            // Fallback: extract filename from path
            const pathSegments = url.split('/');
            const filename = pathSegments[pathSegments.length - 1];
            return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
        }
    };

    const renderFilePreview = () => {
        if (!state.link) return null;

        const fileName = getFileNameFromUrl(state.link);
        const isImage = selectedFileType === 'image';
        const isVideo = selectedFileType === 'video';
        const isAudio = selectedFileType === 'audio';
        const isCloudinary = state.link.includes('cloudinary.com');

        return (
            <div className="mt-2 p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                    {isImage ? (
                        <div className="relative">
                            <img 
                                src={state.link} 
                                alt="Uploaded image" 
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center';
                                        fallback.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                        parent.appendChild(fallback);
                                    }
                                }}
                            />
                            {isCloudinary && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ) : isVideo ? (
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Video className="w-6 h-6 text-blue-600" />
                        </div>
                    ) : isAudio ? (
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-purple-600" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-600" />
                        </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {fileName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            {isCloudinary && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    Cloudinary
                                </span>
                            )}
                            <span>{selectedFileType.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {state.link && (
                        <button 
                            onClick={() => window.open(state.link!, '_blank')} 
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open in new tab"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={() => setState(prev => ({ ...prev, link: null }))} 
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove file"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    const renderLocationSelector = () => {
        if (selectedFileType !== 'maps') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    {state.location && (
                        <button
                            type="button"
                            onClick={handleRemoveLocation}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.location ? (
                    <button
                        type="button"
                        onClick={() => setShowMapSelector(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <MapPin className="w-5 h-5" />
                        <span>Select Location on Map</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.location.name || 'Selected Location'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {state.location.address}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {state.location.latitude.toFixed(6)}, {state.location.longitude.toFixed(6)}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMapSelector(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCtaSelector = () => {
        if (selectedFileType !== 'cta') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Call-to-Action Button</label>
                    {state.cta && (
                        <button
                            type="button"
                            onClick={handleRemoveCta}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.cta ? (
                    <button
                        type="button"
                        onClick={() => setShowCtaConfig(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <MousePointer className="w-5 h-5" />
                        <span>Configure CTA Button</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MousePointer className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.cta.buttonText || 'CTA Button'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {state.cta.url}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Style: {state.cta.style || 'primary'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCtaConfig(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderApiSelector = () => {
        if (selectedFileType !== 'api') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">HTTP API Configuration</label>
                    {state.api && (
                        <button
                            type="button"
                            onClick={handleRemoveApi}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.api ? (
                    <button
                        type="button"
                        onClick={() => setShowApiConfig(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5" />
                        <span>Configure HTTP API</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.api.method} {state.api.endpoint}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {state.api.description || 'API Endpoint'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {Object.keys(state.api.headers || {}).length} headers configured
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowApiConfig(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderConditionSelector = () => {
        if (selectedFileType !== 'condition') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Condition Logic</label>
                    {state.condition && (
                        <button
                            type="button"
                            onClick={handleRemoveCondition}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.condition ? (
                    <button
                        type="button"
                        onClick={() => setShowConditionConfig(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Link className="w-5 h-5" />
                        <span>Configure Condition</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Link className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.condition.field} {state.condition.operator} {state.condition.value}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {state.condition.description || 'Condition Rule'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Field: {state.condition.field}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConditionConfig(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderInteractiveSelector = () => {
        if (selectedFileType !== 'interactive') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Chatbot Selection</label>
                    {state.interactive && (
                        <button
                            type="button"
                            onClick={handleRemoveInteractive}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.interactive ? (
                    <button
                        type="button"
                        onClick={() => setShowInteractiveConfig(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Network className="w-5 h-5" />
                        <span>Select Chatbot</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Network className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.interactive.chatbotName}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    ID: {state.interactive.chatbotId}
                                </div>
                                {state.interactive.description && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {state.interactive.description}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInteractiveConfig(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTemplateSelector = () => {
        if (selectedFileType !== 'template') return null;

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Template Selection</label>
                    {state.template && (
                        <button
                            type="button"
                            onClick={handleRemoveTemplate}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            Remove
                        </button>
                    )}
                </div>
                
                {!state.template ? (
                    <button
                        type="button"
                        onClick={() => setShowTemplateConfig(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Palette className="w-5 h-5" />
                        <span>Select Template</span>
                    </button>
                ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Palette className="w-5 h-5 text-pink-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {state.template.templateName || 'Template'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Category: {state.template.category}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Language: {state.template.language} | Status: {state.template.status}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTemplateConfig(true)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="relative mb-4">
                <button
                    type="button"
                    onClick={() => setShowFileTypeMenu(!showFileTypeMenu)}
                    className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <currentOption.icon className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-900">{currentOption.label}</span>
                    </div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </button>

                {showFileTypeMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                        {FILE_TYPE_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleFileTypeSelect(option.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                    selectedFileType === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                }`}
                            >
                                <option.icon className="w-4 h-4" />
                                <span className="text-xs">{option.label}</span>
                            </button>
                        ))}
                        <div className="border-t border-gray-200">
                            <button
                                onClick={() => setShowFileTypeMenu(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 transition-colors text-red-600"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs">Cancel</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Location Selector for Maps */}
            {renderLocationSelector()}

            {/* CTA Button Selector */}
            {renderCtaSelector()}

            {/* HTTP API Configuration Selector */}
            {renderApiSelector()}

            {/* Condition Logic Selector */}
            {renderConditionSelector()}

            {/* Interactive Message Selector */}
            {renderInteractiveSelector()}

            {/* Template Message Selector */}
            {renderTemplateSelector()}

            {['image', 'video', 'audio', 'file'].includes(selectedFileType) && (
                <div className="mb-4">
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {selectedFileType === 'image' && 'Upload Image'}
                            {selectedFileType === 'video' && 'Upload Video'}
                            {selectedFileType === 'audio' && 'Upload Audio'}
                            {selectedFileType === 'file' && 'Upload File'}
                        </label>
                        <p className="text-xs text-gray-500">
                            {selectedFileType === 'image' && 'Supports JPG, PNG, GIF, WebP, SVG'}
                            {selectedFileType === 'video' && 'Supports MP4, WebM, AVI, MOV'}
                            {selectedFileType === 'audio' && 'Supports MP3, WAV, AAC, FLAC'}
                            {selectedFileType === 'file' && 'Any file type supported'}
                        </p>
                    </div>
                    
                    <Upload 
                        workspaceId={workspaceId}
                        accept={getAcceptTypes()}
                        link={state.link}
                        onUploadComplete={handleUploadComplete}
                        onError={(error) => {
                            console.error('Upload error:', error);
                        }}
                    />
                    
                    {renderFilePreview()}
                    
                    {state.link && (
                        <div className="mt-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                File uploaded successfully
                            </span>
                            {state.link.includes('cloudinary.com') && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    Cloudinary CDN
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {selectedFileType === 'text' && (
                <div className="mt-2">
                    <TextInput 
                        value={caption.value.toString()} 
                        setValue={caption.setValue}
                    />
                </div>
            )}

            {/* Map Selection Modal */}
            {showMapSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
                            <button
                                onClick={() => setShowMapSelector(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Office, Home, Restaurant"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.location?.name || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        location: {
                                            ...(prev.location || {}),
                                            name: e.target.value,
                                            latitude: prev.location?.latitude || 0,
                                            longitude: prev.location?.longitude || 0,
                                            address: prev.location?.address || ''
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter full address"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.location?.address || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        location: {
                                            ...(prev.location || {}),
                                            address: e.target.value,
                                            latitude: prev.location?.latitude || 0,
                                            longitude: prev.location?.longitude || 0,
                                            name: prev.location?.name || ''
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0.000000"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={state.location?.latitude || ''}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            location: {
                                                ...(prev.location || {}),
                                                latitude: parseFloat(e.target.value) || 0,
                                                longitude: prev.location?.longitude || 0,
                                                address: prev.location?.address || '',
                                                name: prev.location?.name || ''
                                            }
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0.000000"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={state.location?.longitude || ''}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            location: {
                                                ...(prev.location || {}),
                                                longitude: parseFloat(e.target.value) || 0,
                                                latitude: prev.location?.latitude || 0,
                                                address: prev.location?.address || '',
                                                name: prev.location?.name || ''
                                            }
                                        }))}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMapSelector(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (state.location?.address && state.location?.latitude && state.location?.longitude) {
                                            handleLocationSelect(state.location);
                                        }
                                    }}
                                    disabled={!state.location?.address || !state.location?.latitude || !state.location?.longitude}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Select Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Configuration Modal */}
            {showCtaConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Configure CTA Button</h3>
                            <button
                                onClick={() => setShowCtaConfig(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Learn More, Get Started, Shop Now"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.cta?.buttonText || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        cta: {
                                            ...(prev.cta || {}),
                                            buttonText: e.target.value,
                                            url: prev.cta?.url || '',
                                            style: prev.cta?.style || 'primary'
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.cta?.url || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        cta: {
                                            ...(prev.cta || {}),
                                            url: e.target.value,
                                            buttonText: prev.cta?.buttonText || '',
                                            style: prev.cta?.style || 'primary'
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Button Style
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'primary', label: 'Primary', color: 'bg-blue-600 text-white' },
                                        { value: 'secondary', label: 'Secondary', color: 'bg-gray-600 text-white' },
                                        { value: 'outline', label: 'Outline', color: 'border border-blue-600 text-blue-600' }
                                    ].map((style) => (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => setState(prev => ({
                                                ...prev,
                                                cta: {
                                                    ...(prev.cta || {}),
                                                    style: style.value as 'primary' | 'secondary' | 'outline',
                                                    buttonText: prev.cta?.buttonText || '',
                                                    url: prev.cta?.url || ''
                                                }
                                            }))}
                                            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                                                state.cta?.style === style.value 
                                                    ? style.color 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCtaConfig(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (state.cta?.buttonText && state.cta?.url) {
                                            handleCtaUpdate(state.cta);
                                        }
                                    }}
                                    disabled={!state.cta?.buttonText || !state.cta?.url}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save CTA Button
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HTTP API Configuration Modal */}
            {showApiConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Configure HTTP API</h3>
                            <button
                                onClick={() => setShowApiConfig(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        API Endpoint
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://api.example.com/endpoint"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={state.api?.endpoint || ''}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            api: {
                                                ...(prev.api || {}),
                                                endpoint: e.target.value,
                                                method: prev.api?.method || 'GET',
                                                headers: prev.api?.headers || {},
                                                body: prev.api?.body || '',
                                                description: prev.api?.description || ''
                                            }
                                        }))}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        HTTP Method
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={state.api?.method || 'GET'}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            api: {
                                                ...(prev.api || {}),
                                                method: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                                                endpoint: prev.api?.endpoint || '',
                                                headers: prev.api?.headers || {},
                                                body: prev.api?.body || '',
                                                description: prev.api?.description || ''
                                            }
                                        }))}
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                        <option value="PATCH">PATCH</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Fetch user data, Update profile, etc."
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.api?.description || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        api: {
                                            ...(prev.api || {}),
                                            description: e.target.value,
                                            endpoint: prev.api?.endpoint || '',
                                            method: prev.api?.method || 'GET',
                                            headers: prev.api?.headers || {},
                                            body: prev.api?.body || ''
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Request Headers (Optional)
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(state.api?.headers || {}).map(([key, value], index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Header name"
                                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                                value={key}
                                                onChange={(e) => {
                                                    const newHeaders = { ...state.api?.headers };
                                                    delete newHeaders[key];
                                                    newHeaders[e.target.value] = value;
                                                    setState(prev => ({
                                                        ...prev,
                                                        api: {
                                                            ...(prev.api || {}),
                                                            headers: newHeaders,
                                                            endpoint: prev.api?.endpoint || '',
                                                            method: prev.api?.method || 'GET',
                                                            body: prev.api?.body || '',
                                                            description: prev.api?.description || ''
                                                        }
                                                    }));
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Header value"
                                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                                value={value}
                                                onChange={(e) => setState(prev => ({
                                                    ...prev,
                                                    api: {
                                                        ...(prev.api || {}),
                                                        headers: { ...(prev.api?.headers || {}), [key]: e.target.value },
                                                        endpoint: prev.api?.endpoint || '',
                                                        method: prev.api?.method || 'GET',
                                                        body: prev.api?.body || '',
                                                        description: prev.api?.description || ''
                                                    }
                                                }))}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newHeaders = { ...state.api?.headers };
                                                    delete newHeaders[key];
                                                    setState(prev => ({
                                                        ...prev,
                                                        api: {
                                                            ...(prev.api || {}),
                                                            headers: newHeaders,
                                                            endpoint: prev.api?.endpoint || '',
                                                            method: prev.api?.method || 'GET',
                                                            body: prev.api?.body || '',
                                                            description: prev.api?.description || ''
                                                        }
                                                    }));
                                                }}
                                                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setState(prev => ({
                                            ...prev,
                                            api: {
                                                ...(prev.api || {}),
                                                headers: { ...(prev.api?.headers || {}), '': '' },
                                                endpoint: prev.api?.endpoint || '',
                                                method: prev.api?.method || 'GET',
                                                body: prev.api?.body || '',
                                                description: prev.api?.description || ''
                                            }
                                        }))}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        + Add Header
                                    </button>
                                </div>
                            </div>
                            
                            {['POST', 'PUT', 'PATCH'].includes(state.api?.method || 'GET') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Request Body (Optional)
                                    </label>
                                    <textarea
                                        placeholder="Enter JSON or form data"
                                        rows={4}
                                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                                        value={state.api?.body || ''}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            api: {
                                                ...(prev.api || {}),
                                                body: e.target.value,
                                                endpoint: prev.api?.endpoint || '',
                                                method: prev.api?.method || 'GET',
                                                headers: prev.api?.headers || {},
                                                description: prev.api?.description || ''
                                            }
                                        }))}
                                    />
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowApiConfig(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (state.api?.endpoint && state.api?.method) {
                                            const cleanHeaders = Object.fromEntries(
                                                Object.entries(state.api.headers || {}).filter(([k, v]) => k.trim() && v.trim())
                                            );
                                            handleApiUpdate({
                                                ...state.api,
                                                headers: cleanHeaders
                                            });
                                        }
                                    }}
                                    disabled={!state.api?.endpoint || !state.api?.method}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save API Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Condition Configuration Modal */}
            {showConditionConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Configure Condition</h3>
                            <button
                                onClick={() => setShowConditionConfig(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Field Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., user_type, age, location, status"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.condition?.field || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        condition: {
                                            ...(prev.condition || {}),
                                            field: e.target.value,
                                            operator: prev.condition?.operator || 'equals',
                                            value: prev.condition?.value || '',
                                            description: prev.condition?.description || ''
                                        }
                                    }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    The field or property to check in your data
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operator
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.condition?.operator || 'equals'}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        condition: {
                                            ...(prev.condition || {}),
                                            operator: e.target.value as 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists',
                                            field: prev.condition?.field || '',
                                            value: prev.condition?.value || '',
                                            description: prev.condition?.description || ''
                                        }
                                    }))}
                                >
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="not_contains">Not Contains</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                    <option value="exists">Exists</option>
                                    <option value="not_exists">Not Exists</option>
                                </select>
                            </div>
                            
                            {!['exists', 'not_exists'].includes(state.condition?.operator || 'equals') && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Value
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., premium, 18, active, etc."
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={state.condition?.value || ''}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            condition: {
                                                ...(prev.condition || {}),
                                                value: e.target.value,
                                                field: prev.condition?.field || '',
                                                operator: prev.condition?.operator || 'equals',
                                                description: prev.condition?.description || ''
                                            }
                                        }))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        The value to compare against (not needed for exists/not_exists)
                                    </p>
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Check if user is premium, Validate age requirement, etc."
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={state.condition?.description || ''}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        condition: {
                                            ...(prev.condition || {}),
                                            description: e.target.value,
                                            field: prev.condition?.field || '',
                                            operator: prev.condition?.operator || 'equals',
                                            value: prev.condition?.value || ''
                                        }
                                    }))}
                                />
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Condition Preview:</h4>
                                <p className="text-sm text-blue-700">
                                    {state.condition?.field ? (
                                        <>
                                            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                                                {state.condition.field}
                                            </span>
                                            {' '}
                                            <span className="font-medium">
                                                {state.condition.operator.replace('_', ' ')}
                                            </span>
                                            {!['exists', 'not_exists'].includes(state.condition.operator) && state.condition.value && (
                                                <>
                                                    {' '}
                                                    <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                                                        {state.condition.value}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        'Configure the condition above to see a preview'
                                    )}
                                </p>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowConditionConfig(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (state.condition?.field && state.condition?.operator) {
                                            if (['exists', 'not_exists'].includes(state.condition.operator) || state.condition.value) {
                                                handleConditionUpdate(state.condition);
                                            }
                                        }
                                    }}
                                    disabled={!state.condition?.field || !state.condition?.operator || (!['exists', 'not_exists'].includes(state.condition?.operator || '') && !state.condition?.value)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Save Condition
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Configuration Modal */}
            {showInteractiveConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Select Chatbot</h3>
                            <button
                                onClick={() => setShowInteractiveConfig(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Available Chatbots
                                </label>
                                {loadingChatbots ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-500 mt-2">Loading chatbots...</p>
                                    </div>
                                ) : chatbots.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Network className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No chatbots found</p>
                                        <p className="text-xs text-gray-400 mt-1">Create a chatbot first to use this feature</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {chatbots.map((chatbot) => (
                                            <button
                                                key={chatbot.id}
                                                type="button"
                                                onClick={() => {
                                                    handleInteractiveUpdate({
                                                        chatbotId: chatbot.id,
                                                        chatbotName: chatbot.name,
                                                        description: chatbot.trigger || undefined
                                                    });
                                                }}
                                                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                                                    state.interactive?.chatbotId === chatbot.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {chatbot.name}
                                                        </div>
                                                        {chatbot.trigger && (
                                                            <div className="text-xs text-gray-600 mt-1 truncate">
                                                                Trigger: {chatbot.trigger}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Published: {chatbot.publish ? 'Yes' : 'No'}
                                                        </div>
                                                    </div>
                                                    {state.interactive?.chatbotId === chatbot.id && (
                                                        <div className="ml-2">
                                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInteractiveConfig(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fetchChatbots()}
                                    disabled={loadingChatbots}
                                    className="px-4 py-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Configuration Modal */}
            {showTemplateConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Select Template</h3>
                            <button
                                onClick={() => setShowTemplateConfig(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Available Templates
                                </label>
                                {loadingTemplates ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-500 mt-2">Loading templates...</p>
                                    </div>
                                ) : templates.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Palette className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No templates found</p>
                                        <p className="text-xs text-gray-400 mt-1">Create a template first to use this feature</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {templates.map((template) => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => {
                                                    handleTemplateUpdate({
                                                        templateId: template.id,
                                                        templateName: template.name,
                                                        category: template.category,
                                                        language: template.language,
                                                        status: template.status,
                                                        description: undefined
                                                    });
                                                }}
                                                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                                                    state.template?.templateId === template.id
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {template.name}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            Category: {template.category}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Language: {template.language} | Status: {template.status}
                                                        </div>
                                                    </div>
                                                    {state.template?.templateId === template.id && (
                                                        <div className="ml-2">
                                                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateConfig(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fetchTemplates()}
                                    disabled={loadingTemplates}
                                    className="px-4 py-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBotMsg;