import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const phone = '+2348101126131';
    
    const conversation = await prisma.conversation.findFirst({
      where: { phone, workspaceId: 1 },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get the chatbot configuration
    let chatbot = null;
    if (conversation.chatbotId) {
      chatbot = await prisma.chatbot.findUnique({
        where: { id: conversation.chatbotId },
        select: { id: true, name: true, trigger: true, bot: true }
      });
    }

    return res.status(200).json({
      conversation: {
        id: conversation.id,
        phone: conversation.phone,
        status: conversation.status,
        chatbotId: conversation.chatbotId,
        currentNode: conversation.currentNode,
        chatbotTimeout: conversation.chatbotTimeout,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      chatbot: chatbot ? {
        id: chatbot.id,
        name: chatbot.name,
        trigger: chatbot.trigger,
        hasBotConfig: !!chatbot.bot
      } : null,
      recentMessages: conversation.messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        fromCustomer: msg.fromCustomer,
        isBot: msg.isBot,
        createdAt: msg.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug conversation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

