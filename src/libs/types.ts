export type StatusCode =  200 | 201 | 300 | 301 | 302 | 400 | 401 | 403 | 404 | 405 | 500 | 502

export type ChatComponentType =  "HEADER" | "BODY" | "FOOTER" | "BUTTONS"

export type ChatFormatType =  "TEXT" | "VIDEO" | "IMAGE"

export type ChatLanguageType =  "en_US" | "en_UK"

export type ChatStatusType =  "APPROVED" | "Approved" | "Submitted" | "PENDING" // | "BODY" | "FOOTER"

export type MESSAGE_BUTTON_TYPE = "URL" | "PHONE_NUMBER" | "NONE"

export type ApiResponse<T = any> = {
    status: "success" | "failed",
    statusCode: StatusCode,
    message: string,
    data: T
}

export type ChatsResponse = {
    chats: any[]; 
    total?: number;
    page?: number;
    limit?: number;
}

export type TEMPLATE_STATUS = "APPROVED" | "REJECTED" | "PENDING" | "SUBMITTED"

export type ACCEPTED_FILES = "none" | "image" | "video" | "audio"