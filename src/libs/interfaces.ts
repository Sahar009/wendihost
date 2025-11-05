import { Message } from "@prisma/client";
import { ACCEPTED_FILES, ChatComponentType, ChatFormatType, ChatLanguageType, ChatStatusType, MESSAGE_BUTTON_TYPE } from "./types"
import { CUSTOM_NODE } from "./enums";
import type { TemplateParams } from "@/components/dashboard/template/TemplateVariables";

export interface User {
    id: number,
    firstName: string,
    lastName: string,
    workspaces: Workspace[]
}

export interface Workspace {
    id: number,
    name: string,
    description: string
}

export interface MESSAGE_BUTTON {
    type: MESSAGE_BUTTON_TYPE;
    text: string;
    phone_number?: string;
    url?: string;
}

export interface MESSAGE_COMPONENT {
    type: ChatComponentType,
    format?: ChatFormatType,
    text?: string
    buttons?: MESSAGE_BUTTON[]
    parameters?: TemplateParams[] 
    example?: {
        body_text?: string[];
        header_text?: string[];
        footer_text?: string[];
    }
}

export interface MESSAGE_TEMPLATE {
    id: string,
    name: string,
    category: string,
    components: MESSAGE_COMPONENT[],
    language: ChatLanguageType,
    status: ChatStatusType
}

export interface IReduxState {
    conversations: {
        value: Message[]
    },
    system: {
        value: Message[]
        filterBy: "open" | "closed",
        sortedBy: "open" | "closed",    
    }
}


export interface INodeFlowProps {
    data: {
        value: number
    }
}

export interface INodeConnect {
    source: string;
    sourceHandle: string | null;
    target: string;
    targetHandle: string | null
}

export interface ICHATBOT_NODE {
    type: CUSTOM_NODE;
    message: string;
    link: string;
    fileType: ACCEPTED_FILES;
    children: ICHATBOT_NODE[];
    nodeId: string;
    next: string | null;
    needResponse: boolean;
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
}

export interface IAuthProps {
    reseller: string
}

export interface IConversationCounts {
    open: number,
    assigned: number,
    unassigned: number
}
