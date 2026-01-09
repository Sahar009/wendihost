export enum AUTH_ROUTES {
    LOGIN = "/auth/login",
    CREATE_ACCOUNT = "/auth/create-account",
    FORGOT = "/auth/forgot",
    RESET = "/auth/reset",
    LOGIN_TEAM = "/auth/workspace",
}

export enum DASHBOARD_ROUTES {
    DASHBOARD = "/dashboard/",
    CONTACTS = "/dashboard/contacts",
    CHATS = "/dashboard/chat",
    CHATBOT = "/dashboard/chatbot",
    CHATBOT_NEW = "/dashboard/chatbot/new",
    SHORTS = "/dashboard/wa-short-links",
    TEMPLATES = "/dashboard/templates",
    RESELLER = "/dashboard/reseller",
    SNIPPETS = "/dashboard/templates/snippets",
    TEMPLATE_BUILDER = "/dashboard/templates/new-template",
    SETTING = "/dashboard/settings",
    LOGOUT = "/dashboard/logout",
    METAADS = "/dashboard/metaads",
    AUTOMATIONS = "/dashboard/automations",
    LEADGEN = "/dashboard/leadgen",
}








// APIs
export enum AUTH_APIS {
    LOGIN = "/api/auth/login",
    SIGN_UP = "/api/auth/create",
    FORGOT = "/api/auth/forgot",
    RESET = "/api/auth/reset",
    LOGIN_TEAM = "/api/auth/workspace",
}



export enum APIS_ACTION {
    CREATE = "/create",
    EDIT = "/edit",
    GET = "/get",
    DELETE = "/delete",
}


export enum CUSTOM_NODE {
    START_NODE = "START_NODE",
    MESSAGE_REPLY_NODE = "MESSAGE_REPLY_NODE",
    OPTION_MESSAGE_NODE = "OPTION_MESSAGE_NODE",
    OPTION_NODE = "OPTION_NODE",
    CHAT_WITH_AGENT = "CHAT_WITH_AGENT",
    BUTTON_MESSAGE_NODE = "BUTTON_MESSAGE_NODE",
    BUTTON_NODE = "BUTTON_NODE",
    CHAT_BOT_MSG_NODE = "CHAT_BOT_MSG_NODE",
    TEXT_NODE = "TEXT_NODE",
    IMAGE_NODE = "IMAGE_NODE",
    VIDEO_NODE = "VIDEO_NODE",
    AUDIO_NODE = "AUDIO_NODE",
    FILE_NODE = "FILE_NODE",
    INTERACTIVE_NODE = "INTERACTIVE_NODE",
    MAPS_NODE = "MAPS_NODE",
    CTA_BUTTON_NODE = "CTA_BUTTON_NODE",
    API_NODE = "API_NODE",
    CONDITION_NODE = "CONDITION_NODE",
    TEMPLATE_NODE = "TEMPLATE_NODE"
}


export enum IMETAPermission {
    WHATSAPP_BIZ_MGT = "whatsapp_business_management",
    WHATSAPP_MSG_MGT = "whatsapp_business_messaging",
    BIZ_MGT          = "business_management"
}

