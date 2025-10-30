export const PROJECT_NAME = "Wendi"
export const BUSINESS_ID = process.env.BUSINESS_ID
export const BUSINESS_ACCESS_TOKEN = process.env.BUSINESS_ACCESS_TOKEN
export const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.BUSINESS_ID
export const WHATSAPP_BUSINESS_PHONE_ID = process.env.BUSINESS_PHONE_ID
export const FACEBOOK_BASE_ENDPOINT = "https://graph.facebook.com/v21.0/"
export const FACEBOOK_API = `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}`
export const FACEBOOK_PHONE_API = `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_PHONE_ID}`
export const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID 
export const FACEBOOK_CONFIG_ID = process.env.NEXT_PUBLIC_FB_CONFIG_ID
export const FACEBOOK_CLIENT_SECRET = process.env.FB_CLIENT_SECRET
export const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID


export const RESET_TIME = 3600000

export const DOMAIN = String(process.env.DOMAIN)

export const TEMPLATE_CATEGORY = [
    { value: "UTILITY", name: "UTILITY" },
    { value: "MARKETING", name: "MARKETING" },
    { value: "AUTHENTICATION", name: "AUTHENTICATION" },
]


export const BUTTON_TYPE = [
    { value: "NONE", name: "None" },
    { value: "URL", name: "Url" },
    { value: "PHONE_NUMBER", name: "Phone Number" },
]


export const DUMMY_PHOTO = "https://wendi.app/peacock.jpg"