import { FACEBOOK_BASE_ENDPOINT, SYSTEM_USER_ID } from "@/libs/constants"
import { facebookAuth } from "../facebook"


export const setWhatsAppSystemUser = async (authToken: string, whatsapp: string, user: string) => {
    try {
        const res = await facebookAuth().post(`${FACEBOOK_BASE_ENDPOINT}${whatsapp}/assigned_users?user=${SYSTEM_USER_ID}&tasks=["DEVELOP"]&access_token=${authToken}`)
        console.log(res.data)
        return res.data
    } catch (e) {
        //console.log(e)
        //console.log(e?.response?.data)
        return false
    }
}

export const getSystemUsers = async () => {
    try {
        const res = await facebookAuth().get(`${FACEBOOK_BASE_ENDPOINT}${process.env.BUSINESS_ID}/system_users?access_token=${process.env.BUSINESS_ACCESS_TOKEN}`)
        return res.data
    } catch (e) {
        return false
    }
}


export const setAssignedUser = async (authToken: string, whatsapp: string, user: string) => {
    try {
        const res = await facebookAuth(authToken).post(`${FACEBOOK_BASE_ENDPOINT}${whatsapp}/assigned_users?user=${user}&tasks=["MANAGE"]`)
        return res.data
    } catch (e) {
        console.log(e)
        return false
    }
}


export const getAssignedUsers = async (access_token: string, whatsappId: string, businessId: string) => {
    try {
        const res = await facebookAuth(access_token).get(`${FACEBOOK_BASE_ENDPOINT}${whatsappId}/assigned_users?business=${businessId}`)
        return res.data
    } catch (e) {
        //console.log(e?.response?.data)
        return false
    }
}
