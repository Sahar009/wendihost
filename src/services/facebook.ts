import { FACEBOOK_BASE_ENDPOINT, FACEBOOK_PHONE_API } from "@/libs/constants";
import prisma from "@/libs/prisma";
import axios from "axios";
import chatbotFlow from "./chatbot";
import { cp } from "fs";
import { downloadFile } from "./waba/send-msg";


export const facebookAuth = (authToken: string | null = null) => {
    const config = {
        headers: {
            "Authorization": `Bearer ${authToken || process.env.BUSINESS_ACCESS_TOKEN}`
        }
    }
    return axios.create(config)
}

export const getBusinessId = async (access_token: string) => {
    try {
        const res = await facebookAuth().get(`${FACEBOOK_BASE_ENDPOINT}debug_token?input_token=${access_token}`)
        return res.data
    } catch (e) {
        return false
    }
}



export const handleMsgCallback = async (entry: any[]) => {

    try {

        const value = entry[0]

        const changes = value?.changes?.[0]?.value

        const message = changes?.messages?.[0]

        const metadata = changes?.metadata

        const status = changes?.statuses?.[0]

        console.log("status", status)

        if (status) {
            console.log("YES")
            switch (status?.status) {
                case "delivered":
                    return true
                case "read":
                    return true
                case "failed":
                    return true
                default:
                    return true
            }
        }

        const phone_number_id = metadata?.phone_number_id

        const workspace = await prisma.workspace.findFirst({
            where: {
                phoneId: phone_number_id
            },
            select: {
                id: true,
                accessToken: true,
            }
        })

        if (!workspace) return

        const accessToken = String(workspace.accessToken) 

        const workspaceId = workspace.id

        const sender = `+${message.from}`

        let output_message = ""
        let link = ""
        let interactive = false

        switch (message.type) {
            case "text":
                output_message = message?.text?.body
                break
            case "interactive":
                output_message = message?.interactive
                interactive = true
                break
            case "image":
                output_message = message?.image?.caption
                link = await downloadFile(accessToken, message?.image?.id)
                break
            case "video":
                output_message = message?.video?.caption
                link = await downloadFile(accessToken, message?.video?.id)
                break
            default:
                output_message = message?.text?.body
                break

        }

        console.log("output message", output_message)

        let conversation = await prisma.conversation.findFirst({
            where: {
                phone: sender,
                workspaceId: workspaceId,
            }
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    phone: sender,
                    workspaceId: workspaceId,
                    status: "open",
                    read: false
                }
            })
        } else {
            const chatbot = await chatbotFlow(conversation, output_message, interactive)
            if (!chatbot) {
                // If no chatbot triggered, check automation settings
                console.log('🤖 FACEBOOK WEBHOOK: No chatbot triggered, checking automation...');
                
                try {
                    const { AutomationService } = await import('./automation');
                    const automationService = new AutomationService(workspaceId);
                    const automationSettings = await automationService.getSettings();
                    
                    if (automationSettings && automationSettings.automationRules) {
                        console.log('🤖 FACEBOOK WEBHOOK: Automation settings found, checking rules...');
                        
                        const automatedResponse = await automationService.getAutomatedResponse(
                            sender,
                            output_message,
                            conversation,
                            automationSettings
                        );
                        
                        if (automatedResponse) {
                            console.log('✅ FACEBOOK WEBHOOK: Automation triggered:', automatedResponse);
                            
                            if (automatedResponse === 'AI_RESPONSE_SENT') {
                                console.log('✅ FACEBOOK WEBHOOK: AI response sent successfully');
                                return true;
                            } else if (automatedResponse === 'TEMPLATE_MESSAGE_TRIGGERED') {
                                console.log('✅ FACEBOOK WEBHOOK: Template message sent successfully');
                                return true;
                            } else if (automatedResponse === 'CHATBOT_TRIGGERED') {
                                console.log('✅ FACEBOOK WEBHOOK: Chatbot triggered successfully');
                                return true;
                            } else {
                                console.log('✅ FACEBOOK WEBHOOK: Automation handled response');
                                return true;
                            }
                        } else {
                            console.log('❌ FACEBOOK WEBHOOK: No automation rules matched');
                        }
                    } else {
                        console.log('❌ FACEBOOK WEBHOOK: No automation settings found');
                    }
                } catch (automationError) {
                    console.error('❌ FACEBOOK WEBHOOK: Automation error:', automationError);
                }
                
                // If automation didn't handle it, update conversation as before
                await prisma.conversation.update({
                    where: {
                        id: conversation.id
                    },
                    data: {
                        status: "open",
                        updatedAt: new Date(),
                        read: false
                    }
                })
            }

        }

        console.log({conversation})

        await prisma.message.create({
            data: {
                phone: sender, 
                message: output_message,
                workspaceId: workspaceId,
                conversationId: conversation?.id,
                fromCustomer: true,
                link: link,
                fileType: message.type === "text" ? "none" : message.type,
                createdAt: new Date(Number(message.timestamp) * 1000),
                status: "delivered",
                messageId: status?.id
            }
        })

        return true
    } catch (e) {
        console.log("error", e instanceof Error ? e.message : e)
        return false
    }
}