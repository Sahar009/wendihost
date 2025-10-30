import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { AutomationService } from '@/services/automation';
import { sendWhatsAppMessage, sendTemplateMessage } from '@/services/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId, phone } = req.body;
    
    if (!workspaceId || !phone) {
      return res.status(400).json({ error: 'Workspace ID and phone are required' });
    }

    console.log(`Processing automation for workspace ${workspaceId}, phone ${phone}`);

    // Get the conversation for this phone
    const conversation = await prisma.conversation.findFirst({
      where: { 
        phone: phone,
        workspaceId: Number(workspaceId)
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`Found conversation: ${conversation.id}, assigned: ${conversation.assigned}`);

    // Get the last message from this conversation
    const lastMessage = await prisma.message.findFirst({
      where: { 
        conversationId: conversation.id,
        fromCustomer: true // Only customer messages
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastMessage) {
      // Let's check what messages actually exist in this conversation
      const allMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`No customer messages found. All messages in conversation:`, allMessages);
      
      // Try to find any message (not just customer messages)
      const anyMessage = await prisma.message.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (anyMessage) {
        console.log(`Found message (not from customer):`, anyMessage);
        // Use this message for automation testing
        const messageToProcess = anyMessage;
        console.log(`Using message for automation: "${messageToProcess.message}" (${messageToProcess.createdAt})`);
        
        // Get automation settings
        const automationService = new AutomationService(Number(workspaceId));
        const settings = await automationService.getSettings();
        
        if (!settings) {
          return res.status(404).json({ error: 'No automation settings found' });
        }

        console.log(`Automation settings found: ${settings.automationRules?.length} rules`);

        // Check if we should send an automated response
        const automatedResponse = await automationService.getAutomatedResponse(
          phone,
          messageToProcess.message,
          conversation,
          settings
        );

        if (automatedResponse) {
          console.log(`Automation triggered: ${automatedResponse}`);
          
          // Handle different response types
          if (automatedResponse === 'TEMPLATE_MESSAGE_TRIGGERED') {
            return res.json({
              success: true,
              message: 'Template message sent successfully',
              responseType: 'template'
            });
          } else if (automatedResponse === 'AI_RESPONSE_TRIGGERED') {
            return res.json({
              success: true,
              message: 'AI response triggered',
              responseType: 'ai'
            });
          } else if (automatedResponse === 'CHATBOT_TRIGGERED') {
            return res.json({
              success: true,
              message: 'Chatbot triggered successfully',
              responseType: 'chatbot'
            });
          } else {
            return res.json({
              success: true,
              message: 'Text message sent successfully',
              responseType: 'text',
              content: automatedResponse
            });
          }
        } else {
          console.log('No automation rules matched');
          return res.json({
            success: true,
            message: 'No automation rules matched',
            responseType: 'none'
          });
        }
      } else {
        return res.status(404).json({ error: 'No messages found in conversation at all' });
      }
    }

    console.log(`Last message: "${lastMessage.message}" (${lastMessage.createdAt})`);

    // Get automation settings
    const automationService = new AutomationService(Number(workspaceId));
    const settings = await automationService.getSettings();
    
    if (!settings) {
      return res.status(404).json({ error: 'No automation settings found' });
    }

    console.log(`Automation settings found: ${settings.automationRules?.length} rules`);

    // Check if we should send an automated response
    const automatedResponse = await automationService.getAutomatedResponse(
      phone,
      lastMessage.message,
      conversation,
      settings
    );

    if (automatedResponse) {
      console.log(`Automation triggered: ${automatedResponse}`);
      
      // Handle different response types
      if (automatedResponse === 'TEMPLATE_MESSAGE_TRIGGERED') {
        return res.json({
          success: true,
          message: 'Template message sent successfully',
          responseType: 'template'
        });
      } else if (automatedResponse === 'AI_RESPONSE_TRIGGERED') {
        return res.json({
          success: true,
          message: 'AI response triggered',
          responseType: 'ai'
        });
      } else if (automatedResponse === 'CHATBOT_TRIGGERED') {
        return res.json({
          success: true,
          message: 'Chatbot triggered successfully',
          responseType: 'chatbot'
        });
      } else {
        return res.json({
          success: true,
          message: 'Text message sent successfully',
          responseType: 'text',
          content: automatedResponse
        });
      }
    } else {
      console.log('No automation rules matched');
      return res.json({
        success: true,
        message: 'No automation rules matched',
        responseType: 'none'
      });
    }

  } catch (error) {
    console.error('Automation processing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
