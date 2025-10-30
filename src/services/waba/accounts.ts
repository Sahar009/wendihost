import { BUSINESS_ID, FACEBOOK_BASE_ENDPOINT } from "@/libs/constants"
import { facebookAuth } from "../facebook"


export const getBusinessShared = async (access_token: string) => {
    try {
        const res = await facebookAuth().get(`${FACEBOOK_BASE_ENDPOINT}${BUSINESS_ID}/client_whatsapp_business_accounts?fields=id,name,currency,owner_business_info&limit=20&access_token=${access_token}`)
        return res.data
    } catch (e) {
        return false
    }
}



export const subscribe = async (access_token: string, waba_id: string) => {
    try {
        const res = await facebookAuth().post(`${FACEBOOK_BASE_ENDPOINT}${waba_id}/subscribed_apps`, {
            access_token
        })
        return res.data
    } catch (e) {
        return false
    }
}

export const getWhatsappPhone = async (accessToken: string, whatsappId: string) => {
    try {
        const res = await facebookAuth(accessToken).get(`${FACEBOOK_BASE_ENDPOINT}${whatsappId}/phone_numbers?fields=id,cc,country_dial_code,display_phone_number,verified_name,status,quality_rating,search_visibility,platform_type,code_verification_status&access_token=${accessToken}`)
        return res.data.data
    } catch (e) {
        return false
    }
}


export const registerPhoneNumber = async (accessToken: string, phoneId: string) => {
    try {
        const res = await facebookAuth(accessToken).post(`${FACEBOOK_BASE_ENDPOINT}${phoneId}/register`, {
            "messaging_product": "whatsapp",
            "pin": process.env.WHATSAPP_PIN
        })
        return res.data
    } catch (e) {
        return false
    }
}


export const getBusinessLineOfCredit = async () => {
    try {
        const res = await facebookAuth().get(`${FACEBOOK_BASE_ENDPOINT}${BUSINESS_ID}/extendedcredits`)
        console.log(res.data)
        return res.data.data
    } catch (e) {
        console.log(e)
        return false
    }
}


export const hasTemplates = async (accessToken: string, whatsappId: string) => {
    try {
        const res = await facebookAuth().get(`${FACEBOOK_BASE_ENDPOINT}${whatsappId}/message_templates?fields=language,name,rejected_reason,status,category,sub_category,last_updated_time,components,quality_score&limit=50&access_token=${accessToken}`)
        return res.data.data.length == 0
    } catch (e) {
        return false
    }
}

