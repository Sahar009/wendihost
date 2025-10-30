import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import chatbotFlow from '@/services/chatbot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message, isInteractive = false } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/[^\d+]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.startsWith('234') ? '+' + normalizedPhone : '+234' + normalizedPhone;
    }

    console.log('🧪 TEST: Starting chatbot test with:', { phone: normalizedPhone, message, isInteractive });

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { 
        OR: [
          { phone: normalizedPhone },
          { phone: phone }
        ]
      }
    });

    if (!conversation) {
      console.log('🧪 TEST: Creating new conversation for testing');
      
      // Find workspace
      const workspace = await prisma.workspace.findFirst();
      if (!workspace) {
        return res.status(400).json({ error: 'No workspace found' });
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          phone: normalizedPhone,
          workspaceId: workspace.id,
          firstName: 'Test',
          lastName: 'User',
        }
      });

      // Create conversation
      conversation = await prisma.conversation.create({
        data: {
          phone: normalizedPhone,
          workspaceId: workspace.id,
          contact: contact.id ? { connect: { id: contact.id } } : undefined,
          read: false,
          assigned: false,
          status: 'open',
          updatedAt: new Date()
        }
      });
    }

    console.log('🧪 TEST: Conversation found/created:', {
      id: conversation.id,
      phone: conversation.phone,
      status: conversation.status,
      chatbotId: conversation.chatbotId,
      currentNode: conversation.currentNode
    });

    // Call chatbot flow
    const result = await chatbotFlow(conversation, message, isInteractive);

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
      chatbotTriggered: result,
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
    console.error('🧪 TEST: Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
