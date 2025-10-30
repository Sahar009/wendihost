import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const phone = '+2348101126131';
    
    // Reset the conversation to initial state
    await prisma.conversation.updateMany({
      where: { phone, workspaceId: 1 },
      data: {
        chatbotId: null,
        currentNode: null,
        chatbotTimeout: null,
        status: 'open'
      }
    });

    // Get the updated conversation
    const conversation = await prisma.conversation.findFirst({
      where: { phone, workspaceId: 1 }
    });

    return res.status(200).json({
      success: true,
      conversation: conversation ? {
        id: conversation.id,
        phone: conversation.phone,
        status: conversation.status,
        chatbotId: conversation.chatbotId,
        currentNode: conversation.currentNode,
        chatbotTimeout: conversation.chatbotTimeout
      } : null
    });

  } catch (error) {
    console.error('Reset conversation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

