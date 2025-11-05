import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { AutomationService } from '@/services/automation';
import chatbotFlow from '@/services/chatbot';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getGeminiEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
    return result.embedding.values;
}

async function getGeminiChatCompletion(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  //gemini-pro
  const result = await model.generateContent([prompt]);
  return result.response.text();
}

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it as is
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // If it starts with 234 (Nigeria country code), add +
  if (normalized.startsWith('234')) {
    return '+' + normalized;
  }
  
  // If it starts with 0, replace with +234
  if (normalized.startsWith('0')) {
    return '+234' + normalized.substring(1);
  }
  
  // If it's just digits, assume it's a Nigerian number and add +234
  if (/^\d+$/.test(normalized)) {
    return '+234' + normalized;
  }
  
  return normalized;
}

async function getSimpleAutomatedResponse(conversation: any, workspace: any): Promise<string | null> {
  try {
    // Get automation settings directly from database
    const automationSettings = await prisma.automationSettings.findFirst({
      where: { workspaceId: workspace.id }
    });
    
    if (!automationSettings) {
      console.log('No automation settings found for fallback');
      return null;
    }
    
    let rules: any[] = [];
    try {
      if (Array.isArray((automationSettings as any).automationRules)) {
        rules = (automationSettings as any).automationRules as any[];
      } else if (typeof (automationSettings as any).automationRules === 'string') {
        rules = JSON.parse((automationSettings as any).automationRules as string);
      }
    } catch (e) {
      console.error('Fallback: Failed to parse automationRules:', e);
      rules = [];
    }
    const enabledRules = rules.filter((r: any) => r.enabled);
    
    console.log('Fallback: Found', enabledRules.length, 'enabled rules');
    
    // Check if it's working hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    let workingHours = automationSettings.workingHours as any[];
    if (typeof (automationSettings as any).workingHours === 'string') {
      try {
        workingHours = JSON.parse((automationSettings as any).workingHours);
      } catch (_) {
        workingHours = [];
      }
    }
    let isWorkingHours = false;
    
    if (workingHours && Array.isArray(workingHours) && workingHours.length > 0) {
      const dayMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
        'Friday': 5, 'Saturday': 6, 'Sunday': 0
      };
      
      const todayHours = workingHours.find((h: any) => dayMap[h.day as keyof typeof dayMap] === currentDay);
      
      if (todayHours && todayHours.open) {
        const startHour = parseInt(todayHours.startTime.split(':')[0]);
        const endHour = parseInt(todayHours.endTime.split(':')[0]);
        isWorkingHours = currentHour >= startHour && currentHour < endHour;
      }
    }
    
    console.log('Fallback: Is working hours:', isWorkingHours);
    console.log('Fallback: Holiday mode:', automationSettings.holidayMode);
    
    // Rule 1: Out of working hours message
    const rule1 = enabledRules.find((r: any) => r.id === '1');
    if (rule1 && (!isWorkingHours || automationSettings.holidayMode)) {
      console.log('Fallback: Rule 1 (out of hours) triggered');
      return rule1.aiPrompt || 'Thank you for your message. We are currently outside our business hours.';
    }
    
    // Rule 2: No agent during working hours
    const rule2 = enabledRules.find((r: any) => r.id === '2');
    if (rule2 && isWorkingHours && !automationSettings.holidayMode) {
      // Check if there are any team members available
      try {
        const teamMembers = await prisma.member.findMany({
          where: { workspaceId: workspace.id },
          select: { id: true, name: true }
        });
        
        // Rule 2 should trigger when there are NO team members OR no available agents
        if (teamMembers.length === 0) {
          console.log('Fallback: Rule 2 (no agent) triggered - no team members');
          return rule2.aiPrompt || 'Thank you for your message. Our team is currently busy, but we\'ll respond to you shortly. Please hold on!';
        } else {
          console.log('Fallback: Rule 2 (no agent) not applicable - team members exist');
        }
      } catch (error) {
        console.error('Fallback: Error checking team members:', error);
      }
    }
    
    // Rule 3: Welcome message for new conversations
    const rule3 = enabledRules.find((r: any) => r.id === '3');
    if (rule3) {
      const isNewConversation = conversation.createdAt && 
        (Date.now() - new Date(conversation.createdAt).getTime()) < (5 * 60 * 1000);
      
      if (isNewConversation) {
        console.log('Fallback: Rule 3 (welcome) triggered');
        return rule3.aiPrompt || 'Hello! Welcome to our WhatsApp support.';
      }
    }
    
    // Rule 5: Fallback message
    const rule5 = enabledRules.find((r: any) => r.id === '5');
    if (rule5) {
      console.log('Fallback: Rule 5 (fallback) triggered');
      return rule5.aiPrompt || 'Thank you for your message. We are here to help.';
    }
    
    console.log('Fallback: No rules matched');
    return null;
    
  } catch (error) {
    console.error('Fallback automation error:', error);
    return null;
  }
}

async function sendWhatsAppMessage(to: string, text: string, workspace: any) {
  const phoneId = workspace.phoneId;
  const token = workspace.accessToken; 

  if (!phoneId || !token) {
    throw new Error("Workspace WhatsApp phoneId or accessToken missing");
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  // WhatsApp Cloud API expects recipient in international format without '+' or symbols
  const toNumber = String(to).replace(/[^\d]/g, '');

  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "text",
    text: { body: text }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return res.data;
  } catch (err: any) {
    console.error("Failed to send WhatsApp message:", err?.response?.data || err);
    throw err;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // console.log('WEBHOOK RECEIVED:', {
  //   method: req.method,
  //   url: req.url,
  //   query: req.query,
  //   headers: {
  //     'user-agent': req.headers['user-agent'],
  //     'content-type': req.headers['content-type'],
  //     'x-forwarded-for': req.headers['x-forwarded-for'],
  //     'x-forwarded-host': req.headers['x-forwarded-host']
  //   },
  //   body: req.body ? 'Body present' : 'No body',
  //   timestamp: new Date().toISOString()
  // });

  // if (Object.keys(req.query).length > 0) {
  //   console.log('Query parameters:', req.query);
  // }

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // console.log('Webhook verification attempt:', { 
    //   mode, 
    //   token, 
    //   challenge,
    //   expectedToken: process.env.WHATSAPP_WEBHOOK_TOKEN ? 'Set' : 'NOT SET',
    //   tokenMatch: token === process.env.WHATSAPP_WEBHOOK_TOKEN
    // });
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
      console.log('Webhook verified successfully with WhatsApp');
      return res.status(200).send(challenge);
    }
    
    if (!process.env.WHATSAPP_WEBHOOK_TOKEN) {
      console.log('WHATSAPP_WEBHOOK_TOKEN environment variable not set');
      return res.status(500).send('Webhook token not configured');
    }
    
    if (mode !== 'subscribe') {
      console.log('Invalid hub.mode:', mode);
      return res.status(400).send('Invalid hub.mode');
    }
    
    if (token !== process.env.WHATSAPP_WEBHOOK_TOKEN) {
      console.log('Token mismatch - expected:', process.env.WHATSAPP_WEBHOOK_TOKEN, 'received:', token);
      return res.status(403).send('Forbidden - Invalid token');
    }
    
    console.log('Webhook verification failed - unknown reason');
    return res.status(403).send('Forbidden');
  }

  // Handle webhook events
  if (req.method === 'POST') {
    console.log('POST webhook received - processing...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { entry } = req.body;
      
      if (!entry || !Array.isArray(entry)) {
        console.log('Invalid webhook payload - no entry array');
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      console.log(`Processing ${entry.length} webhook entries...`);

      for (const webhookEvent of entry) {
        const changes = webhookEvent.changes || [];
        
        console.log(`Processing ${changes.length} changes in entry...`);
        
        for (const change of changes) {
          console.log('Change type:', change.value?.object, 'Statuses:', change.value?.statuses?.length, 'Messages:', change.value?.messages?.length);
          
          if (change.value.statuses && Array.isArray(change.value.statuses)) {
            console.log('Processing status updates...');
            await processStatusUpdates(change.value.statuses);
          }
          
          if (change.value.messages && Array.isArray(change.value.messages)) {
            console.log('Processing incoming messages...');
            await processIncomingMessages(
              change.value.messages,
              change.value.contacts?.[0],
              change.value.metadata
            );
          }
        }
      }
      
      console.log('Webhook processed successfully');
      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  console.log('Method not allowed:', req.method);
  return res.status(405).send('Method not allowed');
}

async function processStatusUpdates(statuses: any[]) {
  for (const status of statuses) {
    const messageId = status.id;
    const statusValue = status.status?.toUpperCase();
    const recipientId = status.recipient_id;
    const timestamp = status.timestamp ? new Date(parseInt(status.timestamp) * 1000) : new Date();
    
    if (!messageId || !statusValue) continue;
    
    try {
      await prisma.$executeRaw`
        UPDATE "Message" 
        SET 
          status = ${statusValue}::"MessageStatus",
          "metadata" = COALESCE("metadata", '{}'::jsonb) || ${JSON.stringify({
            ...status,
            lastStatusUpdate: timestamp.toISOString()
          })}::jsonb
        WHERE "messageId" = ${messageId}
      `;
      
      if (statusValue === 'DELIVERED') {
        await prisma.$executeRaw`
          UPDATE "Sequence" s
          SET 
            status = 'sent',
            "sentAt" = ${timestamp}
          FROM "Message" m
          WHERE 
            m."messageId" = ${messageId}
            AND m."sequenceId" = s.id
            AND s.status = 'sending'
        `;
      }
      
    } catch (error) {
      console.error(`Error processing status update for message ${messageId}:`, error);
    }
  }
}

async function processIncomingMessages(messages: any[], contactInfo?: any, metadata?: any) {
  console.log('PROCESSING INCOMING MESSAGES:', messages.length, 'messages');
  
  for (const message of messages) {
    try {
      console.log('Processing message:', {
        id: message.id,
        from: message.from,
        type: message.type,
        timestamp: message.timestamp,
        content: message.text?.body || message.interactive?.button_reply?.title || '[No text content]'
      });

      const phone = message.from;
      const messageId = message.id || `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageType = message.type;
      const timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date();
      
      if (!phone) {
        console.log('Skipping message - missing phone:', { phone });
        continue;
      }
      
      console.log('Message ID:', messageId, '(original:', message.id, ')');
      
      // Normalize phone number for consistent lookup
      const normalizedPhone = normalizePhoneNumber(phone);
      console.log('Phone normalization:', phone, '->', normalizedPhone);
      
      console.log('Looking up workspace...');
      let workspace = null as any;
      try {
        const phoneNumberId = metadata?.phone_number_id;
        const displayPhoneNumber = metadata?.display_phone_number;
        console.log('Webhook metadata:', { phone_number_id: phoneNumberId, display_phone_number: displayPhoneNumber });

        if (phoneNumberId) {
          workspace = await prisma.workspace.findFirst({ where: { phoneId: phoneNumberId } });
        }

        if (!workspace && displayPhoneNumber) {
          const normalizedDisplay = normalizePhoneNumber(displayPhoneNumber);
          // Try matching possible fields that may store number
          workspace = await prisma.workspace.findFirst({
            where: {
              OR: [
                // Common field names across installs
                { phone: normalizedDisplay as any },
                { whatsappNumber: normalizedDisplay as any },
                { number: normalizedDisplay as any }
              ] as any
            }
          });
        }

        if (!workspace) {
          // Fallback to workspace named 'default' if present
          workspace = await prisma.workspace.findFirst({ where: { name: 'default' } });
        }

        if (!workspace) {
          // Final fallback to first workspace
          workspace = await prisma.workspace.findFirst();
        }
      } catch (e) {
        console.error('Workspace lookup error:', e);
        workspace = await prisma.workspace.findFirst();
      }
      if (!workspace) {
        console.log('No workspace found');
        throw new Error('No workspace found to associate with conversation');
      }
      console.log('Found workspace:', workspace.id, workspace.name);
      
      // Try to find contact with normalized phone, or with original phone as fallback
      let contact = await prisma.contact.findFirst({
        where: { 
          OR: [
            { phone: normalizedPhone },
            { phone: phone }
          ]
        }
      });
      
      if (!contact) {
        console.log('Creating new contact for phone:', normalizedPhone);
        contact = await prisma.contact.create({
          data: {
            phone: normalizedPhone,
            workspace: {
              connect: { id: workspace.id }
            },
            firstName: 'WhatsApp',
            lastName: `User ${normalizedPhone.substring(normalizedPhone.length - 4)}`,
            email: null
          }
        });
        console.log('Contact created:', contact.id);
      } else {
        console.log('Found existing contact:', contact.id);
        // Update contact phone to normalized format if it's different
        if (contact.phone !== normalizedPhone) {
          console.log('Updating contact phone to normalized format:', contact.phone, '->', normalizedPhone);
          contact = await prisma.contact.update({
            where: { id: contact.id },
            data: { phone: normalizedPhone }
          });
        }
      }
      
      let conversation = await prisma.conversation.findFirst({
        where: { 
          workspaceId: workspace.id,
          OR: [
            { phone: normalizedPhone },
            { phone: phone }
          ]
        }
      });
      
      if (!conversation) {
        console.log('Creating new conversation for phone:', normalizedPhone);
        
        // Check if this might be from a WhatsApp Meta Ad (if user is a new contact)
        let metaAdId: string | undefined = undefined;
        const isNewContact = !contact.phone || contact.phone === 'WhatsApp'; // Check if contact was just created
        
        if (isNewContact) {
          // Look for active WhatsApp Meta Ads in the last 7 days
          const recentAds = await prisma.metaAd.findMany({
            where: {
              workspaceId: workspace.id,
              adType: 'WHATSAPP',
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          });
          
          if (recentAds.length > 0) {
            metaAdId = recentAds[0].id;
            console.log('Attributing conversation to Meta Ad:', metaAdId);
          }
        }
        
        conversation = await prisma.conversation.create({
          data: {
            phone: normalizedPhone,
            workspace: {
              connect: { id: workspace.id }
            },
            contact: {
              connect: { id: contact.id }
            },
            read: false,
            assigned: false,
            status: 'open',
            source: metaAdId ? 'META_ADS' : 'DIRECT',
            metaAd: metaAdId ? { connect: { id: metaAdId } } : undefined,
            updatedAt: new Date()
          }
        });
        console.log('Conversation created:', conversation.id);
      } else {
        console.log('Found existing conversation:', conversation.id, 'status:', conversation.status);
        // Update conversation phone to normalized format if it's different
        if (conversation.phone !== normalizedPhone) {
          console.log('Updating conversation phone to normalized format:', conversation.phone, '->', normalizedPhone);
        }
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            phone: normalizedPhone,
            read: false,
            updatedAt: new Date()
          }
        });
        console.log('Conversation updated');
      }
      
      if (conversation) {
        let messageContent = '';
        let messageTypeValue: 'text' | 'template' | 'action' | 'broadcast' = 'text';
        let fileType: 'none' | 'image' | 'video' | 'audio' = 'none';
        
        if (messageType === 'text') {
          messageContent = message.text?.body || '';
          messageTypeValue = 'text';
        } else if (messageType === 'template') {
          messageContent = `Template: ${message.template?.name || 'Unknown'}`;
          messageTypeValue = 'template';
        } else if (messageType === 'image') {
          messageContent = message.image?.caption || '';
          messageTypeValue = 'text';
          fileType = 'image';
        } else if (messageType === 'document') {
          messageContent = message.document?.filename || '';
          messageTypeValue = 'text';
          fileType = 'none'; 
        } else if (messageType === 'audio') {
          messageContent = 'Audio message';
          messageTypeValue = 'text';
          fileType = 'audio';
        } else if (messageType === 'interactive') {
          // Handle button replies and other interactive messages
          if (message.interactive?.type === 'button_reply') {
            messageContent = message.interactive.button_reply.title;
            messageTypeValue = 'text';
          } else if (message.interactive?.type === 'list_reply') {
            messageContent = message.interactive.list_reply.title;
            messageTypeValue = 'text';
          } else {
            messageContent = `Interactive: ${message.interactive?.type || 'Unknown'}`;
            messageTypeValue = 'text';
          }
        } else {
          messageContent = `[${messageType.toUpperCase()}]`;
        }

        console.log('Message content extracted:', {
          content: messageContent,
          type: messageTypeValue,
          fileType: fileType
        });

        const messageData: any = {
          phone: phone, 
          type: messageTypeValue,
          fromCustomer: true,
          isBot: false,
          fileType: fileType,
          message: messageContent,
          messageId: messageId,
          status: 'delivered',
          conversation: {
            connect: { id: conversation.id }
          },
          workspace: {
            connect: { id: workspace.id }
          }
        };

        if (messageType === 'template' && message.template?.name) {
          messageData.templateId = message.template.name;
        }

        console.log('Saving message to database...');
        await prisma.message.create({
          data: {
            ...messageData,
            phone: normalizedPhone
          }
        });
        console.log('Message saved to database');

        console.log('🤖 WEBHOOK: PROCESSING AUTOMATION...');
        console.log('🤖 WEBHOOK: Workspace details:', { id: workspace.id, name: workspace.name, phoneId: workspace.phoneId });
        try {
          const automationService = new AutomationService(workspace.id);
          const settings = await automationService.getSettings();
          console.log('🤖 WEBHOOK: Settings loaded:', { 
            hasSettings: !!settings, 
            holidayMode: settings?.holidayMode, 
            rulesCount: settings?.automationRules?.length || 0 
          });
          
          if (settings) {
            console.log('Automation settings found:', {
              holidayMode: settings.holidayMode,
              workingHours: settings.workingHours?.length || 0,
              automationRules: settings.automationRules?.length || 0
            });
            
            if (settings.automationRules) {
              console.log('Processing automation rules:');
              settings.automationRules.forEach((rule: any, index: number) => {
                if (rule.enabled) {
                  console.log(`  Rule ${index + 1} (${rule.id}): ${rule.description} - ${rule.responseType}`);
                }
              });
            }
            
            console.log('🤖 WEBHOOK: Calling getAutomatedResponse with:', {
              phone: normalizedPhone,
              message: messageContent.substring(0, 50),
              conversationId: conversation?.id,
              conversationStatus: conversation?.status
            });

            const automatedResponse = await automationService.getAutomatedResponse(
              normalizedPhone,
              messageContent,
              conversation,
              settings
            );
            
            console.log('🤖 WEBHOOK: Automation response:', automatedResponse);
            
            if (automatedResponse) {
              console.log('✅ WEBHOOK: AUTOMATION TRIGGERED:', automatedResponse);
              
              if (automatedResponse === 'TEMPLATE_MESSAGE_TRIGGERED') {
                console.log('Template message sent via automation');
                continue; 
              } else if (automatedResponse === 'AI_RESPONSE_TRIGGERED') {
                console.log('AI automation triggered - will be handled below');
                // Don't continue here - let the AI automation block handle it
              } else if (automatedResponse === 'CHATBOT_TRIGGERED') {
                console.log('Chatbot automation triggered - will be handled below');
                // Don't continue here - let the chatbot block handle it
              } else {
                console.log('Text automation sent');
                continue; 
              }
            } else {
              console.log('❌ WEBHOOK: No automation rules matched - trying fallback...');
              
              // Try fallback automation when main automation returns null
              try {
                const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
                if (fallbackResponse && conversation) {
                  console.log('FALLBACK AUTOMATION TRIGGERED:', fallbackResponse);
                  
                  // Send the response directly
                  await prisma.message.create({
                    data: {
                      phone: normalizedPhone,
                      type: 'text',
                      fromCustomer: false,
                      isBot: true,
                      fileType: 'none',
                      message: fallbackResponse,
                      messageId: `fallback_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      status: 'sent',
                      conversationId: conversation.id,
                      workspaceId: workspace.id
                    }
                  });
                  
                  await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                  console.log('Fallback automation response sent successfully');
                  continue;
                } else {
                  console.log('Fallback automation also returned null');
                }
              } catch (fallbackError) {
                console.error('Fallback automation error:', fallbackError);
              }
            }
          } else {
            console.log('No automation settings found');
            // Attempt simple fallback automation when settings are missing
            try {
              const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
              if (fallbackResponse && conversation) {
                console.log('FALLBACK AUTOMATION (no settings) TRIGGERED:', fallbackResponse);
                await prisma.message.create({
                  data: {
                    phone: normalizedPhone,
                    type: 'text',
                    fromCustomer: false,
                    isBot: true,
                    fileType: 'none',
                    message: fallbackResponse,
                    messageId: `fallback_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: 'sent',
                    conversationId: conversation.id,
                    workspaceId: workspace.id
                  }
                });
                await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                console.log('Fallback automation response (no settings) sent successfully');
                continue;
              }
            } catch (fallbackError) {
              console.error('Fallback automation (no settings) error:', fallbackError);
            }
          }
        } catch (error) {
          console.error('Automation error:', error);
          
          // Fallback: Simple automation without Gemini API
          console.log('FALLBACK: Trying simple automation...');
          try {
            const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
            if (fallbackResponse && conversation) {
              console.log('FALLBACK AUTOMATION TRIGGERED:', fallbackResponse);
              
              // Send the response directly
              await prisma.message.create({
                data: {
                  phone: normalizedPhone,
                  type: 'text',
                  fromCustomer: false,
                  isBot: true,
                  fileType: 'none',
                  message: fallbackResponse,
                  messageId: `fallback_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  status: 'sent',
                  conversationId: conversation.id,
                  workspaceId: workspace.id
                }
              });
              
              await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
              console.log('Fallback automation response sent successfully');
              continue;
            }
          } catch (fallbackError) {
            console.error('Fallback automation error:', fallbackError);
          }
        }

        // Check chatbot triggers FIRST (original correct flow)
        console.log('🤖 CHECKING FOR CHATBOT TRIGGER...');
        try {
          if ((messageType === 'text' || messageType === 'interactive') && messageContent) {
            const isInteractive = messageType === 'interactive';
            const messageData = isInteractive ? message.interactive : messageContent;
            
            console.log('🤖 Calling chatbotFlow with:', {
              conversationId: conversation.id,
              message: messageData,
              isInteractive: isInteractive,
              workspaceId: conversation.workspaceId,
              conversationStatus: conversation.status,
              conversationChatbotId: conversation.chatbotId,
              conversationCurrentNode: conversation.currentNode
            });
            
            const chatbotTriggered = await chatbotFlow(
              conversation, 
              messageData, 
              isInteractive
            );
            
            console.log('🔍 WEBHOOK: Chatbot flow result:', chatbotTriggered);
            
            if (chatbotTriggered) {
              console.log('✅ CHATBOT FLOW TRIGGERED SUCCESSFULLY!');
              console.log('⏭️ Skipping automation since chatbot handled response');
              continue;
            } else {
              console.log('❌ No chatbot triggered for message:', messageContent);
              console.log('🔄 Reloading conversation from database after chatbot attempt...');
              
              // Reload conversation from database to get updated state after chatbot processing
              conversation = await prisma.conversation.findFirst({
                where: { 
                  phone: normalizedPhone, 
                  workspaceId: workspace.id 
                }
              });
              
              if (!conversation) {
                console.log('❌ Conversation not found after chatbot processing');
                continue;
              }
              
              console.log('✅ Conversation reloaded:', {
                id: conversation.id,
                chatbotId: conversation.chatbotId,
                currentNode: conversation.currentNode,
                status: conversation.status
              });
              
              // Check if conversation has an expired chatbot and clear it AFTER trigger check
              if (conversation.chatbotId && conversation.chatbotTimeout && 
                  Number(conversation.chatbotTimeout) < Date.now()) {
                console.log('🧹 CLEARING EXPIRED CHATBOT AFTER TRIGGER CHECK:', {
                  chatbotId: conversation.chatbotId,
                  timeout: conversation.chatbotTimeout,
                  expired: true
                });
                
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: {
                    chatbotId: null,
                    currentNode: null,
                    chatbotTimeout: null,
                    status: 'open'
                  }
                });
                
                console.log('✅ Expired chatbot cleared, conversation reset to open');
                
                // Update the conversation object for subsequent processing
                conversation = await prisma.conversation.findUnique({
                  where: { id: conversation.id }
                });
              }
              
              console.log('➡️ Continuing to automation...');
            }
          } else {
            console.log('⏭️ Skipping chatbot check - not text or interactive message');
          }
        } catch (error) {
          console.error('❌ CHATBOT TRIGGER ERROR:', error);
        }

        console.log('🔍 WEBHOOK: Reached automation check point');
        
        // Check automation settings AFTER chatbot (if no chatbot handled it)
        console.log('🤖 CHECKING AUTOMATION SETTINGS...');
        try {
          const automationService = new AutomationService(workspace.id);
          const automationSettings = await automationService.getSettings();
          
          if (automationSettings && automationSettings.automationRules) {
            console.log('🤖 AUTOMATION: Checking automation rules...');
            
            const automatedResponse = await automationService.getAutomatedResponse(
              normalizedPhone,
              messageContent,
              conversation,
              automationSettings
            );
            
            if (automatedResponse) {
              console.log('✅ AUTOMATION: Automation rule triggered:', automatedResponse);
              
              if (automatedResponse === 'TEMPLATE_MESSAGE_TRIGGERED') {
                console.log('Template message sent via automation');
                continue; 
              } else if (automatedResponse === 'AI_RESPONSE_TRIGGERED') {
                console.log('AI automation triggered - will be handled below');
                // Don't continue here - let the AI automation block handle it
              } else if (automatedResponse === 'CHATBOT_TRIGGERED') {
                console.log('Chatbot automation triggered - will be handled below');
                // Don't continue here - let the chatbot block handle it
              } else {
                console.log('Text automation sent');
                continue; 
              }
            } else {
              console.log('❌ AUTOMATION: No automation rules matched - trying fallback...');
              
              // Try fallback automation when main automation returns null
              try {
                const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
                if (fallbackResponse && conversation) {
                  console.log('FALLBACK AUTOMATION TRIGGERED:', fallbackResponse);
                  
                  // Send the response directly
                  await prisma.message.create({
                    data: {
                      phone: normalizedPhone,
                      type: 'text',
                      fromCustomer: false,
                      isBot: true,
                      fileType: 'none',
                      message: fallbackResponse,
                      messageId: `fallback_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      status: 'sent',
                      conversationId: conversation.id,
                      workspaceId: workspace.id
                    }
                  });
                  
                  await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                  console.log('Fallback automation response sent successfully');
                  continue;
                } else {
                  console.log('Fallback automation also returned null');
                }
              } catch (fallbackError) {
                console.error('Fallback automation error:', fallbackError);
              }
            }
          } else {
            console.log('No automation settings found');
            // Attempt simple fallback automation when settings are missing
            try {
              const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
              if (fallbackResponse && conversation) {
                console.log('FALLBACK AUTOMATION TRIGGERED:', fallbackResponse);
                
                // Send the response directly
                await prisma.message.create({
                  data: {
                    phone: normalizedPhone,
                    type: 'text',
                    fromCustomer: false,
                    isBot: true,
                    fileType: 'none',
                    message: fallbackResponse,
                    messageId: `fallback_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status: 'sent',
                    conversationId: conversation.id,
                    workspaceId: workspace.id
                  }
                });
                
                await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                console.log('Fallback automation response sent successfully');
                continue;
              } else {
                console.log('Fallback automation also returned null');
              }
            } catch (fallbackError) {
              console.error('Fallback automation error:', fallbackError);
            }
          }
        } catch (error) {
          console.error('❌ AUTOMATION ERROR:', error);
        }

        console.log('CHECKING AI AUTOMATION...');
        try {
          const assistant = await prisma.assistant.findFirst({
            where: { workspaceId: workspace.id, status: 'active' }
          });
          
          let aiAutomationTriggered = false;
          
          if ( 
              assistant &&
              messageType === 'text' &&
              messageContent &&
              messageContent.length > 3 
          ) {
            console.log('Active assistant found, processing with semantic search...');
            const messageEmbedding = await getGeminiEmbedding(messageContent);

            const chunks = await prisma.assistantKnowledgeChunk.findMany({
              where: { assistantId: assistant.id }
            });

           
            if (chunks.length > 0) {
              console.log(`Found ${chunks.length} knowledge chunks, generating AI response...`);
              const scored = chunks.map(chunk => ({
                ...chunk,
                score: cosineSimilarity(messageEmbedding, chunk.embedding as number[])
              }));
              const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, 5);

              const context = topChunks.map(c => c.content).join('\n');
              const prompt = `User asked: ${messageContent}\nBusiness info:\n${context}`;

              const reply = await getGeminiChatCompletion(prompt);
              console.log('AI generated reply from semantic search:', reply.substring(0, 100) + '...');

              if (!conversation) {
                await sendWhatsAppMessage(normalizedPhone, reply, workspace);
                console.log('AI semantic response sent without DB (no conversation)');
                aiAutomationTriggered = true;
              } else {
                await prisma.message.create({
                data: {
                  phone: normalizedPhone,
                  type: 'text',
                  fromCustomer: false,
                  isBot: true,
                  fileType: 'none',
                  message: reply,
                  messageId: `ai_semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  status: 'sent',
                  conversationId: conversation.id,
                  workspaceId: workspace.id
                }
              });

                await sendWhatsAppMessage(normalizedPhone, reply, workspace);
                console.log('AI semantic search response sent successfully');
                aiAutomationTriggered = true;
              }
              
            } else {
              console.log('No knowledge chunks found for AI processing');
            }
          } else {
            console.log('Skipping AI automation:', {
              hasAssistant: !!assistant,
              messageType: messageType,
              hasContent: !!messageContent,
              contentLength: messageContent?.length || 0,
              aiAutomationTriggered
            });
            // Final safety net: if no AI response and no assistant used, try simple fallback automation
            if (!aiAutomationTriggered) {
              try {
                const fallbackResponse = await getSimpleAutomatedResponse(conversation, workspace);
                if (fallbackResponse && conversation) {
                  if (!conversation) {
                    await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                    console.log('Final fallback automation response sent without DB (no conversation)');
                    continue;
                  }
                  console.log('FINAL FALLBACK AUTOMATION TRIGGERED:', fallbackResponse);
                  await prisma.message.create({
                    data: {
                      phone: normalizedPhone,
                      type: 'text',
                      fromCustomer: false,
                      isBot: true,
                      fileType: 'none',
                      message: fallbackResponse,
                      messageId: `final_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      status: 'sent',
                      conversationId: conversation.id,
                      workspaceId: workspace.id
                    }
                  });
                  await sendWhatsAppMessage(normalizedPhone, fallbackResponse, workspace);
                  console.log('Final fallback automation response sent successfully');
                }
              } catch (finalFallbackError) {
                console.error('Final fallback automation error:', finalFallbackError);
              }
            }
          }
        } catch (err) {
          console.error('AI automation error:', err);
        }
      }
      
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }
  
  console.log('FINISHED PROCESSING ALL INCOMING MESSAGES');
}