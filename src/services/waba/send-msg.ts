import { DUMMY_PHOTO, FACEBOOK_BASE_ENDPOINT } from "@/libs/constants"
import { facebookAuth } from "../facebook"
import { Workspace } from "@prisma/client"
import { IMessage } from "../chatbot"


export const handleTextMsgType = async (workspace: Workspace, phone: string, chat: IMessage) => {

    // Handle both relative and absolute URLs
    let link = chat.link;
    if (link && !link.startsWith('http')) {
        link = "https://wendi.app" + chat.link;
    }
    
    console.log('📤 CHATBOT: handleTextMsgType called:', {
        phone,
        fileType: chat.fileType,
        originalLink: chat.link,
        constructedLink: link,
        message: chat.message,
        nodeId: chat.nodeId
    });

    switch(chat.fileType) {
        case "image":
            await sendImageMsg(workspace, phone, link, chat.message)
            break
        case "video":
            await sendVideoMsg(workspace, phone, link, chat.message)
            break
        case "audio":
            await sendAudioMsg(workspace, phone, link, chat.message)
            break
        default:
            await sendTextMsg(workspace, phone, chat.message)
    }
    
}


export const sendTextMsg = async (workspace: Workspace, phone: string, content: string) => {
    try {
        const body = { 
            "messaging_product": "whatsapp", 
            "recipient_type": "individual",
            "to": phone, 
            "type": "text", 
            "text":  { 
                "body": content
            }
        }
        
        const endpoint = `${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`
        
        const res = await facebookAuth(workspace.accessToken).post(endpoint, body)
        return res.data
    } catch (e: any) {
        console.error('Error sending text message:', e.response?.data || e.message)
        
        // Check for specific WhatsApp errors
        if (e.response?.data?.error) {
            const error = e.response.data.error
            console.error('WhatsApp API Error:', {
                code: error.code,
                title: error.title,
                message: error.message,
                type: error.type
            })
            
            // Return error details for better handling
            return { 
                error: true, 
                code: error.code, 
                message: error.message,
                title: error.title 
            }
        }
        
        return false
    }
}

export const sendImageMsg = async (workspace: Workspace, phone: string, imageUrl: string, caption?: string) => {
    console.log('🖼️ CHATBOT: Sending image message:', {
        phone,
        imageUrl,
        caption,
        workspaceId: workspace.id
    });
    
    try {
        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual", 
            "to": phone,
            "type": "image",
            "image": {
                "link": imageUrl,
                "caption": caption
            }
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        console.log('✅ CHATBOT: Image sent successfully');
        return res.data
    } catch (e) {
        console.error('❌ CHATBOT: Error sending image:', e);
        return false
    }
}

export const sendVideoMsg = async (workspace: Workspace, phone: string, videoUrl: string, caption?: string) => {
    try {
        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "video",
            "video": {
                "link": videoUrl,
                "caption": caption
            }
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return res.data
    } catch (e) {
        return false
    }
}

export const sendAudioMsg = async (workspace: Workspace, phone: string, audioUrl: string, caption: string) => {
    try {
        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "audio",
            "audio": {
                "link": audioUrl,
                "caption": caption
            }
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return res.data
    } catch (e) {
        return false
    }
}

export const sendDocumentMsg = async (workspace: Workspace, phone: string, documentUrl: string, filename: string, caption?: string) => {
    try {
        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "document",
            "document": {
                "link": documentUrl,
                "filename": filename,
                "caption": caption
            }
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return res.data
    } catch (e) {
        return false
    }
}




export const sendButtonMsg = async (workspace: Workspace, phone: string, content: string, children: any[]) => {
    console.log("BUTTONS")
    const buttons = children.map((child) => {
        return  { 
            type: "reply",
            reply: {
                id: child.nodeId,
                title: child.message
            }
        }
    })
    try {
    
        const body = { 
            messaging_product: "whatsapp", 
            recipient_type: "individual",
            to: phone, 
            type: "interactive", 
            interactive:  {
                type: "button",
                body:   {   text: content   },
                action: {   buttons     }
            }
        }

        // console.log({body})
        // console.log(body.interactive.action.buttons)
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        return res.data
    } catch (e) {
        //console.log(e.response.data)
        return false
    }
}



export const downloadFile = async (accessToken: string, fileId: string) => {
    try {
        const res = await facebookAuth(accessToken).get(`${FACEBOOK_BASE_ENDPOINT}${fileId}`)
        console.log("File: ",res.data)
        return res.data
    } catch (e) {
        return false
    }
}