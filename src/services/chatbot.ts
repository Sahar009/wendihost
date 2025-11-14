import { CUSTOM_NODE } from "@/libs/enums"
import { ICHATBOT_NODE } from "@/libs/interfaces"
import prisma from "@/libs/prisma"
import { Conversation, Workspace } from "@prisma/client"
import { handleTextMsgType, sendButtonMsg } from "./waba/send-msg"
import { ACCEPTED_FILES } from "@/libs/types"


export interface IChatHandler  {
    workspace: Workspace,
    receiverPhoneId: string,
    conversationId: number
}

export interface IMessage { 
    nodeId: string,
    message: string,
    link: any,
    fileType: ACCEPTED_FILES;
    openChat: boolean,
    type: CUSTOM_NODE,
    children: ICHATBOT_NODE[],
    location?: {
        latitude: number;
        longitude: number;
        address: string;
        name?: string;
    } | null,
    cta?: {
        buttonText: string;
        url: string;
        style?: 'primary' | 'secondary' | 'outline';
    } | null,
    api?: {
        endpoint: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        headers?: Record<string, string>;
        body?: string;
        description?: string;
    } | null;
}

export interface IInteractiveMessage {
    type: 'button_reply',
    button_reply: { 
        id: string, 
        title: string
    }
}

const chatbotFlow = async (conversation: Conversation, message: any, interactive: boolean) : Promise<boolean> => {

    console.log("BOT FLOW")

    let chatbot;

    // If conversation already has a chatbot, continue with that chatbot
    if (conversation.chatbotId) {
        console.log("🔄 Continuing with existing chatbot ID:", conversation.chatbotId)
        chatbot = await prisma.chatbot.findUnique({
            where: { id: conversation.chatbotId },
            select: {
                id: true,
                bot: true,
                trigger: true,
                name: true
            }
        });
        
        if (chatbot) {
            console.log("✅ Found existing chatbot:", chatbot.name, "trigger:", chatbot.trigger)
        }
    }

    // If no existing chatbot or couldn't find it, search for new chatbot by trigger
    if (!chatbot) {
        console.log("🔍 No existing chatbot, searching for new one by trigger")
        chatbot = await findBot(conversation, message)
    }

    if (!chatbot) {
        console.log("No chatbot found for message:", message)
        console.log("🔍 CHATBOT: Returning false - no chatbot found")
        return false
    }

    const chatbotTimeout = new Date(Date.now() + 720000)

    const workspace = await prisma.workspace.findUnique({where: {id: conversation?.workspaceId}})

    if (!workspace) {
        console.log("No workspace found for conversation:", conversation.id)
        return false
    }

    const chatHandlers : IChatHandler = {
        receiverPhoneId: conversation.phone as string,
        workspace: workspace,
        conversationId: conversation.id
    }

    if (conversation.chatbotId && chatbot) {
        // Continue existing chatbot flow
        console.log('🔄 CHATBOT: Continuing existing chatbot flow:', {
            chatbotId: conversation.chatbotId,
            currentNode: conversation.currentNode,
            status: conversation.status,
            timeout: conversation.chatbotTimeout
        });

        // Check timeout but allow trigger processing even if expired
        const isExpired = Number(conversation.chatbotTimeout) < Date.now();
        if (isExpired) {
            console.log("⚠️ CHATBOT: Timeout expired, but checking for trigger or interactive message first")
            
            // If it's an interactive message (button click), allow it to continue the flow
            // Interactive messages are part of the active conversation, not new triggers
            if (interactive && message && typeof message === 'object') {
                console.log("✅ CHATBOT: Interactive message detected on expired chatbot, continuing flow")
                // Extend the timeout and continue with the flow
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        chatbotTimeout: chatbotTimeout
                    }
                });
                // Continue with the flow below (don't return false)
            }
            // If it's a trigger message (string), allow it to restart the chatbot
            else if (message && typeof message === 'string') {
                const messageText = message.toLowerCase().trim();
                const triggerText = chatbot.trigger?.toLowerCase().trim();
                
                console.log("🔍 CHATBOT: Checking trigger match:", {
                    message: messageText,
                    trigger: triggerText,
                    exactMatch: messageText === triggerText,
                    containsMatch: messageText.includes(triggerText),
                    triggerStartsWithSlash: triggerText?.startsWith('/'),
                    messageWithoutSlash: messageText.replace('/', '')
                });
                
                // Check for exact match or trigger without slash
                const isExactMatch = messageText === triggerText;
                const isTriggerWithoutSlash = triggerText?.startsWith('/') && 
                    messageText === triggerText.substring(1);
                const isContainsMatch = triggerText && messageText.includes(triggerText);
                
                if (isExactMatch || isTriggerWithoutSlash || isContainsMatch) {
                    console.log("🔄 CHATBOT: Trigger detected on expired chatbot, restarting flow")
                    // Clear the expired chatbot and start fresh
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: {
                            chatbotId: null,
                            currentNode: null,
                            chatbotTimeout: null,
                            status: 'open'
                        }
                    });
                    
                    // Update conversation object
                    conversation.chatbotId = null;
                    conversation.currentNode = null;
                    conversation.chatbotTimeout = null;
                    conversation.status = 'open';
                    
                    // Restart the chatbot flow from the beginning
                    console.log("🔄 CHATBOT: Restarting chatbot flow from beginning");
                    return await chatbotFlow(conversation, message, interactive);
                } else {
                    console.log("❌ CHATBOT: No trigger match, chatbot expired")
                    return false
                }
            } else {
                console.log("❌ CHATBOT: No trigger or interactive message, chatbot expired")
                return false
            }
        }

        if (!chatbot.bot) {
            console.log("❌ CHATBOT: No chatbot or bot configuration found for ID:", conversation.chatbotId)
            return false
        }

        const bot = JSON.parse(chatbot.bot as string)
        console.log('🔍 CHATBOT: Bot configuration loaded, nodes:', Object.keys(bot));

        if (interactive) {
            console.log('🔄 CHATBOT: Processing interactive message:', message);
            console.log('🔄 CHATBOT: Current node:', conversation.currentNode);

            const newNode = handleInteractiveMsg(message, bot[conversation.currentNode as string], bot)

            if (!newNode) {
                console.log("❌ CHATBOT: No new node found for interactive message")
                console.log("❌ CHATBOT: Message type:", message?.type);
                console.log("❌ CHATBOT: Current node config:", bot[conversation.currentNode as string]);
                return false
            }

            console.log('✅ CHATBOT: New node found:', newNode);
            const messages = generateMessages(bot, newNode as string)

            const length = messages.length - 1

            if (length < 0) {
                console.log("⚠️ CHATBOT: No messages generated, but continuing flow");
                return true
            }
    
            await sendMessages(chatHandlers, messages, 0, true)
    
            await updateLastNode(conversation.id, messages[length].nodeId)
            console.log('✅ CHATBOT: Updated last node to:', messages[length].nodeId);
    
            return true

        }

    
        console.log('🔄 CHATBOT: Processing text message:', message);
        console.log('🔄 CHATBOT: Current node:', conversation.currentNode);
        console.log('🔄 CHATBOT: Current node config:', bot[conversation.currentNode as string]);
        
        const currentNode = bot[conversation.currentNode as string];
        const newNode = handleMsgOption(message, currentNode, bot)

        if (!newNode) {
            console.log("❌ CHATBOT: No new node found for message option")
            console.log("❌ CHATBOT: Message:", message);
            console.log("❌ CHATBOT: Current node type:", currentNode?.type);
            console.log("❌ CHATBOT: Current node children:", currentNode?.children?.length || 0);
            
            // Check if this is an end-of-flow scenario (no children)
            if (currentNode?.children?.length === 0) {
                console.log("🏁 CHATBOT: End of flow reached - checking if user wants to restart");
                
                // Check if the message is a trigger word to restart the chatbot
                if (message && typeof message === 'string') {
                    const messageText = message.toLowerCase().trim();
                    const triggerText = chatbot.trigger?.toLowerCase().trim();
                    
                    const isExactMatch = messageText === triggerText;
                    const isTriggerWithoutSlash = triggerText?.startsWith('/') && 
                        messageText === triggerText.substring(1);
                    const isContainsMatch = triggerText && messageText.includes(triggerText);
                    
                    if (isExactMatch || isTriggerWithoutSlash || isContainsMatch) {
                        console.log("🔄 CHATBOT: Trigger detected at end of flow - restarting chatbot");
                        
                        // Clear current chatbot and restart
                        await prisma.conversation.update({
                            where: { id: conversation.id },
                            data: {
                                chatbotId: null,
                                currentNode: null,
                                chatbotTimeout: null,
                                status: 'open'
                            }
                        });
                        
                        // Update conversation object
                        conversation.chatbotId = null;
                        conversation.currentNode = null;
                        conversation.chatbotTimeout = null;
                        conversation.status = 'open';
                        
                        // Continue to start new chatbot flow below
                    } else {
                        console.log("🏁 CHATBOT: End of flow - sending final message and closing");
                        
                        // Send the current node's message as final response
                        const finalMessage = currentNode.message;
                        if (finalMessage) {
                            console.log("📤 CHATBOT: Sending final message:", finalMessage);
                            
                            await prisma.message.create({
                                data: {
                                    phone: conversation.phone,
                                    type: 'text',
                                    fromCustomer: false,
                                    isBot: true,
                                    fileType: 'none',
                                    message: finalMessage,
                                    messageId: `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    status: 'sent',
                                    conversationId: conversation.id,
                                    workspaceId: conversation.workspaceId
                                }
                            });
                            
                            // Send via WhatsApp
                            await sendMessages(chatHandlers, [{
                                nodeId: currentNode.nodeId,
                                message: finalMessage,
                                fileType: 'none',
                                link: null,
                                openChat: false,
                                type: 'TEXT_NODE' as CUSTOM_NODE,
                                children: []
                            }], 0, true);
                        }
                        
                        // Close the conversation
                        await prisma.conversation.update({
                            where: { id: conversation.id },
                            data: {
                                chatbotId: null,
                                currentNode: null,
                                chatbotTimeout: null,
                                status: 'closed'
                            }
                        });
                        
                        console.log("✅ CHATBOT: Conversation closed successfully");
                        return true;
                    }
                } else {
                    console.log("🏁 CHATBOT: End of flow - sending final message and closing");
                    
                    // Send the current node's message as final response
                    const finalMessage = currentNode.message;
                    if (finalMessage) {
                        console.log("📤 CHATBOT: Sending final message:", finalMessage);
                        
                        await prisma.message.create({
                            data: {
                                phone: conversation.phone,
                                type: 'text',
                                fromCustomer: false,
                                isBot: true,
                                fileType: 'none',
                                message: finalMessage,
                                messageId: `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                status: 'sent',
                                conversationId: conversation.id,
                                workspaceId: conversation.workspaceId
                            }
                        });
                        
                        // Send via WhatsApp
                        await sendMessages(chatHandlers, [{
                            nodeId: currentNode.nodeId,
                            message: finalMessage,
                            fileType: 'none',
                            link: null,
                            openChat: false,
                            type: 'TEXT_NODE' as CUSTOM_NODE,
                            children: []
                        }], 0, true);
                    }
                    
                    // Close the conversation
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: {
                            chatbotId: null,
                            currentNode: null,
                            chatbotTimeout: null,
                            status: 'closed'
                        }
                    });
                    
                    console.log("✅ CHATBOT: Conversation closed successfully");
                    return true;
                }
            }
            
            return false
        }

        console.log('✅ CHATBOT: New node found:', newNode);
        const messages = generateMessages(bot, newNode as string)

        if (messages.length === 0) {
            console.log("❌ CHATBOT: No messages generated for new node")
            return false
        }

        console.log('✅ CHATBOT: Generated', messages.length, 'messages');
        await sendMessages(chatHandlers, messages, 0, true)

        await updateLastNode(conversation.id, messages[messages.length - 1].nodeId)
        console.log('✅ CHATBOT: Updated last node to:', messages[messages.length - 1].nodeId);

        return true

    } else if (chatbot) {
        // Start new chatbot flow
        console.log('🆕 CHATBOT: Starting new chatbot flow:', {
            chatbotId: chatbot.id,
            chatbotName: chatbot.name,
            trigger: chatbot.trigger
        });

        // get the bot nodes
        if (!chatbot.bot) {
            console.log("Chatbot has no bot configuration:", chatbot.id)
            return false
        }

        const bot = JSON.parse(chatbot.bot as string)

        const messages = generateMessages(bot)

        if (messages.length === 0) {
            console.log("No messages generated from bot configuration")
            return false
        }

        await prisma.conversation.update({
            where: {  id: conversation.id },
            data: {
                chatbotId: chatbot.id,
                currentNode: messages[messages.length - 1].nodeId,
                chatbotTimeout,
                status: "closed"
            }
        })

        await sendMessages(chatHandlers, messages, 0, true)

        return true
    }

    return false

}


const findBot = async(conversation: Conversation, message: string) => {

    try {
        console.log('🔍 Looking for chatbot with message:', message);
        console.log('🔍 Workspace ID:', conversation.workspaceId);

        // First, try case-insensitive trigger match
        let chatbot = await prisma.chatbot.findFirst({
            where: {
                workspaceId: conversation.workspaceId,
                publish: true, // Only published chatbots
                trigger: {
                    equals: String(message),
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                bot: true,
                trigger: true,
                name: true
            }
        });

        if (chatbot) {
            console.log('✅ Found chatbot with exact trigger match:', chatbot.name, 'trigger:', chatbot.trigger);
            return chatbot;
        }

        // Try flexible matching - check if message matches trigger with or without leading slash (case-insensitive)
        const normalizedMessage = message.startsWith('/') ? message.substring(1) : message;
        const normalizedTrigger = message.startsWith('/') ? message : `/${message}`;
        
        chatbot = await prisma.chatbot.findFirst({
            where: {
                workspaceId: conversation.workspaceId,
                OR: [
                    { 
                        trigger: {
                            equals: normalizedMessage,
                            mode: 'insensitive'
                        }
                    },
                    { 
                        trigger: {
                            equals: normalizedTrigger,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: {
                id: true,
                bot: true,
                trigger: true,
                name: true
            }
        });

        if (chatbot) {
            console.log('✅ Found chatbot with flexible trigger match:', chatbot.name, 'trigger:', chatbot.trigger);
            return chatbot;
        }

        // If no exact match, try partial match (message contains trigger)
        // Get all published chatbots and check which one matches
        const allChatbots = await prisma.chatbot.findMany({
            where: {
                workspaceId: conversation.workspaceId,
                publish: true, // Only published chatbots
            },
            select: {
                id: true,
                bot: true,
                trigger: true,
                name: true
            }
        });

        // Check each chatbot to see if message contains its trigger
        for (const bot of allChatbots) {
            if (bot.trigger) {
                const messageStr = String(message).toLowerCase().trim();
                const triggerStr = bot.trigger.toLowerCase().trim();
                
                // Check for various trigger match patterns
                const isExactMatch = messageStr === triggerStr;
                const isTriggerWithoutSlash = triggerStr.startsWith('/') && 
                    messageStr === triggerStr.substring(1);
                const isContainsMatch = messageStr.includes(triggerStr);
                const isMessageContainsTriggerWithoutSlash = triggerStr.startsWith('/') && 
                    messageStr.includes(triggerStr.substring(1));
                
                console.log("🔍 FIND BOT: Checking trigger match:", {
                    botName: bot.name,
                    message: messageStr,
                    trigger: triggerStr,
                    exactMatch: isExactMatch,
                    triggerWithoutSlash: isTriggerWithoutSlash,
                    containsMatch: isContainsMatch,
                    messageContainsTriggerWithoutSlash: isMessageContainsTriggerWithoutSlash
                });
                
                if (isExactMatch || isTriggerWithoutSlash || isContainsMatch || isMessageContainsTriggerWithoutSlash) {
                    console.log('✅ Found chatbot with partial trigger match:', bot.name, 'trigger:', bot.trigger);
                    return bot;
                }
            }
        }

        // If still no match and conversation is closed, try default bot
        // BUT only if the message matches the default bot's trigger
        if (conversation.status === "closed") {
            const defaultChatbot = await prisma.chatbot.findFirst({
                where: {
                    workspaceId: conversation.workspaceId,
                    default: true,
                    publish: true,
                },
                select: {
                    id: true,
                    bot: true,
                    trigger: true,
                    name: true
                }
            });

            if (defaultChatbot && defaultChatbot.trigger) {
                // Only trigger default chatbot if message matches its trigger
                const messageStr = String(message).toLowerCase().trim();
                const triggerStr = defaultChatbot.trigger.toLowerCase().trim();
                
                // Check for various trigger match patterns
                const isExactMatch = messageStr === triggerStr;
                const isTriggerWithoutSlash = triggerStr.startsWith('/') && 
                    messageStr === triggerStr.substring(1);
                const isContainsMatch = messageStr.includes(triggerStr);
                const isMessageContainsTriggerWithoutSlash = triggerStr.startsWith('/') && 
                    messageStr.includes(triggerStr.substring(1));
                
                console.log("🔍 DEFAULT BOT: Checking trigger match:", {
                    botName: defaultChatbot.name,
                    message: messageStr,
                    trigger: triggerStr,
                    exactMatch: isExactMatch,
                    triggerWithoutSlash: isTriggerWithoutSlash,
                    containsMatch: isContainsMatch,
                    messageContainsTriggerWithoutSlash: isMessageContainsTriggerWithoutSlash
                });
                
                if (isExactMatch || isTriggerWithoutSlash || isContainsMatch || isMessageContainsTriggerWithoutSlash) {
                    console.log('✅ Found default chatbot with matching trigger:', defaultChatbot.name, 'trigger:', defaultChatbot.trigger);
                    return defaultChatbot;
                } else {
                    console.log('❌ Default chatbot exists but message does not match trigger:', defaultChatbot.trigger, 'vs message:', messageStr);
                }
            }
        }

        console.log('❌ No chatbot found for message:', message);
        return null;
    
    } catch (e) {
        console.error('Error in findBot:', e);
        return null;
    }
}


const findBotById = async(chatbotId: number) => {

    try {

        const chatbot = await prisma.chatbot.findUnique({
            where: {    id: chatbotId   },
            select: {   id: true,   bot: true   }
        })
 
        return chatbot
    
    } catch (e) {
        console.error(e)  
    }

    return null

}

const updateLastNode = async (id: number, lastNode: string) => {
    await prisma.conversation.update({
        where: {
            id,
        },
        data: {
            currentNode: lastNode
        }
    })
}


const generateMessages = (bot: any, node = "start"): IMessage[] => {

    const botNodes = getBotNode(bot, node)

    // Filter out START_NODE and BUTTON_NODE (connector nodes that shouldn't be sent as messages)
    const filterNodes = botNodes.filter(botNode => 
        botNode.type != CUSTOM_NODE.START_NODE && 
        botNode.type != CUSTOM_NODE.BUTTON_NODE &&
        botNode.type != CUSTOM_NODE.OPTION_NODE
    )

    const messages = filterNodes.map((botNode) => {

        return {
            nodeId: botNode.nodeId,
            message: botNode.message,
            link: botNode.link,
            fileType: botNode.fileType,
            openChat: botNode.type === CUSTOM_NODE.CHAT_WITH_AGENT,
            type: botNode.type,
            children: botNode.children,
            location: botNode.location || null,
            cta: botNode.cta || null,
            api: botNode.api || null
        }
    
    })

    return messages   
}



const getBotNode = (bot: any, node = "start"): ICHATBOT_NODE[]=> {
    console.log('🔍 CHATBOT: getBotNode called with node:', node);
    
    const botNode = bot[node]
    
    if (!botNode) {
        console.log('❌ CHATBOT: Node not found:', node);
        return [];
    }

    console.log('🔍 CHATBOT: Found node:', {
        nodeId: botNode.nodeId,
        type: botNode.type,
        message: botNode.message?.substring(0, 50),
        needResponse: botNode.needResponse,
        hasChildren: !!botNode.children,
        childrenCount: botNode.children?.length || 0,
        next: botNode.next
    });

    const botNodes = [botNode]

    if (botNode.needResponse) {
        console.log('🔍 CHATBOT: Node needs response, stopping here');
        return [...botNodes]
    }

    if (botNode.next) {
        console.log('🔍 CHATBOT: Node has next:', botNode.next);
        return [...botNodes, ...getBotNode(bot, botNode.next)]
    }

    console.log('🔍 CHATBOT: Node has no next, stopping');
    return [...botNodes]
}



const handleMsgOption = (message: string, node: ICHATBOT_NODE, bot: any) : string | null => {
    console.log('🔍 CHATBOT: handleMsgOption called with:', {
        message,
        nodeId: node?.nodeId,
        nodeType: node?.type,
        hasChildren: !!node?.children,
        childrenCount: node?.children?.length || 0
    });

    const children = node?.children

    if (!children || children.length === 0) {
        console.log('❌ CHATBOT: No children found for node:', node?.nodeId);
        return null;
    }

    const option = Number(message)

    console.log('🔍 CHATBOT: Parsed option:', option, 'from message:', message);
    console.log('🔍 CHATBOT: Children available:', children.map((child, index) => ({
        index: index + 1,
        message: child.message,
        next: child.next
    })));

    if (isNaN(option) || option < 1 || option > children.length) {
        console.log('❌ CHATBOT: Invalid option:', option, 'Valid range: 1 to', children.length);
        return null;
    }

    const selectedChild = children[option - 1];
    console.log('✅ CHATBOT: Selected child:', {
        option,
        message: selectedChild.message,
        nodeId: selectedChild.nodeId,
        next: selectedChild.next
    });

    // Return the child's ID as the next node to process
    // Handle both 'id' and 'nodeId' properties for compatibility
    const childId = selectedChild?.nodeId;
    console.log('🔍 CHATBOT: Using child ID:', childId);
    return childId as string;
}


const handleInteractiveMsg = (message: IInteractiveMessage, node: ICHATBOT_NODE, bot: any) : string | null => {

    switch (message?.type) {
        case "button_reply":
            // The button_reply.id contains the button node ID
            // Use it directly to find the next node
            const buttonId = message.button_reply.id;
            console.log('🔍 CHATBOT: Button clicked, ID:', buttonId);
            
            // Check if the button node exists in the bot config
            const buttonNode = bot[buttonId];
            if (buttonNode) {
                console.log('✅ CHATBOT: Found button node:', buttonNode.nodeId);
                // Return the button node's next node, or the button node itself if no next
                return buttonNode.next || buttonId;
            }
            
            // Fallback: try to find by title in current node's children (for backward compatibility)
            const children = node.children;
            if (children && children.length > 0) {
                console.log('🔄 CHATBOT: Falling back to title search in children');
                return fetchOptionNode(message.button_reply.title, children);
            }
            
            console.log('❌ CHATBOT: Button node not found and no children to search');
            return null;
        default:
            return null
    }
}


const sendMessages = async (chatHandlers: IChatHandler, messages: IMessage[], index: number = 0, isBot = false): Promise<number>=> {

    console.log({index})

    if (index < messages.length) {

        const { workspace, receiverPhoneId, conversationId } = chatHandlers
        
        const chat = messages[index]

        await prisma.message.create({
            data: {
                phone: receiverPhoneId, 
                message: chat.message,
                link:  chat.link,
                fileType: chat.fileType as any,
                workspaceId: workspace.id,
                conversationId: chatHandlers.conversationId,
                fromCustomer: false,
                isBot: Boolean(isBot)
            }
        })

        if (chat.openChat) {

            await prisma.conversation.update({
                where: {  id: conversationId },
                data: {
                    chatbotId: null,
                    currentNode: null,
                    chatbotTimeout: null,
                    status: "open"
                }
            })
            
        }

        if (chat.type === CUSTOM_NODE.BUTTON_MESSAGE_NODE) {
            console.log('📤 CHATBOT: Processing button message node:', {
                nodeId: chat.nodeId,
                message: chat.message?.substring(0, 50),
                childrenCount: chat.children?.length || 0,
                children: chat.children
            });
            
            // Ensure children is an array
            const buttonChildren = Array.isArray(chat.children) ? chat.children : [];
            
            if (buttonChildren.length === 0) {
                console.error('❌ CHATBOT: Button message node has no children/buttons');
                // Fallback: send as text message if no buttons
                await handleTextMsgType(workspace, receiverPhoneId, chat);
            } else {
                await sendButtonMsg(workspace, receiverPhoneId, chat.message, buttonChildren);
            }
        } else if (chat.type === CUSTOM_NODE.OPTION_MESSAGE_NODE) {
            await handleTextMsgType(workspace, receiverPhoneId, chat)
        } else {
            await handleTextMsgType(workspace, receiverPhoneId, chat)
        }
        return await sendMessages(chatHandlers, messages, index + 1, isBot)
    }

    return messages.length
}

const fetchOptionNode = (message: string, children: ICHATBOT_NODE[]) => {
    let nextNode = null
    children.forEach((child, index) => {
        if (message === child.message) {
            // Use nodeId property
            nextNode = child.nodeId
            return
        }
    })
    return nextNode
}

export default chatbotFlow