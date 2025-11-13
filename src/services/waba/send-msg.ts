import { DUMMY_PHOTO, FACEBOOK_BASE_ENDPOINT } from "@/libs/constants"
import { facebookAuth } from "../facebook"
import { Workspace } from "@prisma/client"
import { IMessage } from "../chatbot"
import axios from "axios"


export const handleTextMsgType = async (workspace: Workspace, phone: string, chat: IMessage) => {
    // Handle location first (if present)
    if (chat.location) {
        await sendLocationMsg(workspace, phone, chat.location)
        // If there's also text, send it as a separate message
        if (chat.message) {
            await sendTextMsg(workspace, phone, chat.message)
        }
        return
    }

    // Handle CTA button (if present)
    if (chat.cta) {
        // CTA buttons require a body text - use message if available, otherwise use button text or a default message
        const bodyText = chat.message || chat.cta.buttonText || 'Click the button below';
        console.log('📤 CHATBOT: Sending CTA button message:', {
            phone,
            bodyText,
            buttonText: chat.cta.buttonText,
            url: chat.cta.url,
            nodeId: chat.nodeId
        });
        await sendCtaButtonMsg(workspace, phone, bodyText, chat.cta)
        return
    }

    // Handle HTTP API call (if present)
    if (chat.api) {
        await executeAndSendApiResponse(workspace, phone, chat.api, chat.message)
        return
    }

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



export const sendLocationMsg = async (workspace: Workspace, phone: string, location: { latitude: number; longitude: number; name?: string; address?: string }) => {
    try {
        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "location",
            "location": {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "name": location.name || "",
                "address": location.address || ""
            }
        }
        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        console.log('✅ CHATBOT: Location sent successfully');
        return res.data
    } catch (e: any) {
        console.error('❌ CHATBOT: Error sending location:', e.response?.data || e.message)
        return false
    }
}

export const sendCtaButtonMsg = async (workspace: Workspace, phone: string, content: string, cta: { buttonText: string; url: string; style?: string }) => {
    try {
        // Validate required fields
        if (!cta.buttonText || !cta.url) {
            console.error('❌ CHATBOT: CTA button missing required fields:', { buttonText: cta.buttonText, url: cta.url });
            return false;
        }

        // Ensure content is not empty (WhatsApp requires body text)
        const bodyText = content?.trim() || cta.buttonText || 'Click the button below';
        
        // Validate URL format
        let url = cta.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        const body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {
                    "text": bodyText
                },
                "action": {
                    "buttons": [
                        {
                            "type": "url",
                            "url": url,
                            "title": cta.buttonText.substring(0, 20) // WhatsApp limits button title to 20 characters
                        }
                    ]
                }
            }
        }

        console.log('📤 CHATBOT: Sending CTA button request:', {
            phone,
            bodyText: bodyText.substring(0, 50),
            buttonText: cta.buttonText,
            url: url.substring(0, 50)
        });

        const res = await facebookAuth(workspace.accessToken).post(`${FACEBOOK_BASE_ENDPOINT}/${workspace.phoneId}/messages`, body)
        console.log('✅ CHATBOT: CTA button sent successfully:', res.data);
        return res.data
    } catch (e: any) {
        console.error('❌ CHATBOT: Error sending CTA button:', {
            error: e.response?.data || e.message,
            status: e.response?.status,
            statusText: e.response?.statusText
        });
        // Return error details for debugging
        return { 
            error: true, 
            message: e.response?.data?.error?.message || e.message,
            details: e.response?.data 
        };
    }
}

export const executeAndSendApiResponse = async (
    workspace: Workspace, 
    phone: string, 
    apiConfig: { endpoint: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; headers?: Record<string, string>; body?: string }, 
    initialMessage?: string
) => {
    try {
        console.log('🌐 CHATBOT: Executing HTTP API call:', {
            endpoint: apiConfig.endpoint,
            method: apiConfig.method
        });

        // Send initial message if provided
        if (initialMessage) {
            await sendTextMsg(workspace, phone, initialMessage)
        }

        // Prepare request config
        const config: any = {
            method: apiConfig.method,
            url: apiConfig.endpoint,
            headers: {
                'Content-Type': 'application/json',
                ...(apiConfig.headers || {})
            },
            timeout: 30000 // 30 second timeout
        };

        // Add body for POST, PUT, PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(apiConfig.method) && apiConfig.body) {
            try {
                config.data = JSON.parse(apiConfig.body)
            } catch (e) {
                // If body is not valid JSON, send as string
                config.data = apiConfig.body
            }
        }

        // Execute API call
        const response = await axios(config)

        // Format the response
        let responseText = '';
        if (typeof response.data === 'string') {
            responseText = response.data;
        } else if (response.data) {
            try {
                responseText = JSON.stringify(response.data, null, 2);
            } catch (e) {
                responseText = String(response.data);
            }
        } else {
            responseText = `API call successful. Status: ${response.status}`;
        }

        // Truncate if too long (WhatsApp has character limits)
        if (responseText.length > 4000) {
            responseText = responseText.substring(0, 4000) + '\n\n... (response truncated)';
        }

        // Send API response as WhatsApp message
        await sendTextMsg(workspace, phone, responseText)
        console.log('✅ CHATBOT: API response sent successfully');
        return true

    } catch (e: any) {
        console.error('❌ CHATBOT: Error executing API call:', e.response?.data || e.message)
        
        // Send error message to user
        const errorMessage = e.response?.data 
            ? `API Error: ${JSON.stringify(e.response.data)}`
            : `API Error: ${e.message || 'Unknown error occurred'}`;
        
        await sendTextMsg(workspace, phone, errorMessage.substring(0, 4000))
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