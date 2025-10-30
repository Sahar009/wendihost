import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { AutomationService } from '@/services/automation';
import chatbotFlow from '@/services/chatbot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message, testType = 'automation' } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/[^\d+]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.startsWith('234') ? '+' + normalizedPhone : '+234' + normalizedPhone;
    }

    console.log('🧪 AUTOMATION TEST: Starting test with:', { phone: normalizedPhone, message, testType });

    // Find workspace (use workspace ID 1)
    const workspace = await prisma.workspace.findFirst({ where: { id: 1 } });
    if (!workspace) {
      return res.status(400).json({ error: 'No workspace found' });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { 
        OR: [
          { phone: normalizedPhone },
          { phone: phone }
        ],
        workspaceId: 1
      }
    });

    if (!conversation) {
      console.log('🧪 AUTOMATION TEST: Creating new conversation for testing');
      
      // Create contact
      const contact = await prisma.contact.create({
        data: {
          phone: normalizedPhone,
          workspaceId: 1,
          firstName: 'Test',
          lastName: 'User',
        }
      });

      // Create conversation
      conversation = await prisma.conversation.create({
        data: {
          phone: normalizedPhone,
          workspaceId: 1,
          contact: contact.id ? { connect: { id: contact.id } } : undefined,
          read: false,
          assigned: false,
          status: 'open',
          updatedAt: new Date()
        }
      });
    }

    console.log('🧪 AUTOMATION TEST: Conversation found/created:', {
      id: conversation.id,
      phone: conversation.phone,
      status: conversation.status,
      chatbotId: conversation.chatbotId,
      currentNode: conversation.currentNode,
      workspaceId: conversation.workspaceId
    });

    // Step 1: Test chatbot first
    console.log('🧪 AUTOMATION TEST: Testing chatbot flow first...');
    const chatbotTriggered = await chatbotFlow(conversation, message, false);
    console.log('🧪 AUTOMATION TEST: Chatbot triggered:', chatbotTriggered);

    let automationResult = null;
    if (!chatbotTriggered) {
      // Step 2: Test automation if chatbot didn't trigger
      console.log('🧪 AUTOMATION TEST: Chatbot not triggered, testing automation...');
      
      const automationService = new AutomationService(workspace.id);
      const settings = await automationService.getSettings();
      
      console.log('🧪 AUTOMATION TEST: Automation settings:', {
        hasSettings: !!settings,
        holidayMode: settings?.holidayMode,
        rulesCount: settings?.automationRules?.length || 0,
        rules: settings?.automationRules?.map(r => ({
          id: r.id,
          enabled: r.enabled,
          type: r.responseType,
          description: r.description
        })) || []
      });

      if (settings) {
        automationResult = await automationService.getAutomatedResponse(
          normalizedPhone,
          message,
          conversation,
          settings
        );
        console.log('🧪 AUTOMATION TEST: Automation result:', automationResult);
      } else {
        console.log('🧪 AUTOMATION TEST: No automation settings found');
      }
    }

    // Get updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id }
    });

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return res.status(200).json({
      success: true,
      testType,
      phone: normalizedPhone,
      message,
      chatbotTriggered,
      automationResult,
      conversation: {
        id: updatedConversation?.id,
        status: updatedConversation?.status,
        chatbotId: updatedConversation?.chatbotId,
        currentNode: updatedConversation?.currentNode
      },
      recentMessages: recentMessages.map(msg => ({
        message: msg.message,
        fromCustomer: msg.fromCustomer,
        isBot: msg.isBot,
        createdAt: msg.createdAt
      }))
    });

  } catch (error) {
    console.error('🧪 AUTOMATION TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
