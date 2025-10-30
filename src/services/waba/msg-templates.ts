import { FACEBOOK_BASE_ENDPOINT } from "@/libs/constants";
import { Workspace } from "@prisma/client";
import { facebookAuth } from "../facebook";
import { TEMPLATE_STATUS } from "@/libs/types";
import { ITemplateParameter } from "@/components/dashboard/template/TemplateVariables";



export const createAuthTemplate = async (workspace: Workspace) => {
    try {
        const payload = {
            "name": "otp_verify",
            "category": "AUTHENTICATION",
            "language": "en_US",
            "components": [
                {
                    "type": "BODY",
                    "add_security_recommendation": true
                },
                {
                    "type": "FOOTER",
                    "code_expiration_minutes": 10
                },
                {
                    "type": "BUTTONS",
                    "buttons": [
                        {
                            "type": "OTP",
                            "otp_type": "COPY_CODE"
                        }
                    ]
                }
            ]
        }  
        return await submitTemplate(workspace, payload)
    } catch (e) {
        return [false, (e as any).response.data];
    }
}


export const submitTemplate = async (workspace: Workspace, payload: any) => {
    try {
        // Validate payload structure
        if (!payload.name || !payload.category || !payload.language || !payload.components) {
            throw new Error('Missing required fields: name, category, language, or components')
        }
        
        // Validate components structure
        if (!Array.isArray(payload.components) || payload.components.length === 0) {
            throw new Error('Components must be a non-empty array')
        }
        
        // Ensure required fields are present
        const templatePayload = {
            messaging_product: "whatsapp",
            ...payload
        }
        
        console.log('Submitting template with payload:', JSON.stringify(templatePayload, null, 2))
        console.log('Workspace details:', {
            accessToken: workspace.accessToken ? 'present' : 'missing',
            whatsappId: workspace.whatsappId,
            phoneId: workspace.phoneId
        })
        
        if (!workspace.accessToken) {
            throw new Error('Please complete your Meta Business setup. Go to Dashboard → Link Meta Account to connect your WhatsApp Business API.')
        }
        
        if (!workspace.whatsappId) {
            throw new Error('Please complete your Meta Business setup. Go to Dashboard → Link Meta Account to connect your WhatsApp Business API.')
        }
        
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}${workspace.whatsappId}/message_templates`, templatePayload)
        console.log('Template submission successful:', res.data)
        return [true, res.data]
    } catch (e) {
        console.error('Template submission error:', e)
        console.error('Error response:', (e as any).response?.data)
        console.error('Error status:', (e as any).response?.status)
        return [false, (e as any).response?.data || e];
    }
}

export const getTemplate = async (workspace: Workspace, status?: TEMPLATE_STATUS) => {
    try {
        const { accessToken, whatsappId } = workspace 
        const res = await facebookAuth(accessToken).get(`${FACEBOOK_BASE_ENDPOINT}${whatsappId}/message_templates?${status ? `status=${status}` : ''}`)
        return res.data
    } catch (e) {
        return false
    }
}


export const sendTemplateMsg = async (workspace: Workspace, phone: string, templateName: string, parameters: ITemplateParameter[]) => {

    try {
        const body = { 
            "messaging_product": "whatsapp", 
            "to": phone, 
            "type": "template", 
            "recipient_type": "individual",
            "template": { 
                "name": templateName, 
                "language": { "code": "en_US" },
                "components": parameters
            },
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return [true, res.data]
    } catch (e) {
        return [false, (e as any).response.data];    
    }
}



export const sendTemplateOTP = async (workspace: Workspace, phone: string, code: string, time: string) => {

    const components = [
        {
            type: "body",
            parameters: [
                {
                    type: "text",
                    text: code
                }
            ]
        },
        {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
                {
                    type: "text",
                    text: code
                }
            ]
        }
    ]

    try {
        const body = { 
            "messaging_product": "whatsapp", 
            "to": phone, 
            "type": "template", 
            "recipient_type": "individual",
            "template": { 
                "name": "otp_verify", 
                "language": { "code": "en_US" },
                "components": components
            },
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return [true, res.data]
    } catch (e) {
        console.error((e as any).response.data)
        return [false, (e as any).response.data];    
    }
}

