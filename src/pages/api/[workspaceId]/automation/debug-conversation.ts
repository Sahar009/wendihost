import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId, phone } = req.query;
    
    if (!workspaceId || !phone) {
      return res.status(400).json({ error: 'Workspace ID and phone are required' });
    }

    console.log(`Debugging conversation for workspace ${workspaceId}, phone ${phone}`);

    const conversation = await prisma.conversation.findFirst({
      where: { 
        phone: phone as string,
        workspaceId: Number(workspaceId)
      },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Get last 10 messages
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`Found conversation: ${conversation.id}, assigned: ${conversation.assigned}`);

    // Get all messages for this conversation
    const allMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' }
    });

    // Count messages by type
    const messageCounts = {
      total: allMessages.length,
      fromCustomer: allMessages.filter(m => m.fromCustomer).length,
      fromBot: allMessages.filter(m => !m.fromCustomer).length,
      byType: {} as Record<string, number>
    };

    allMessages.forEach(msg => {
      const type = msg.type || 'unknown';
      messageCounts.byType[type] = (messageCounts.byType[type] || 0) + 1;
    });

    return res.json({
      success: true,
      message: 'Conversation debug info',
      data: {
        conversation: {
          id: conversation.id,
          phone: conversation.phone,
          status: conversation.status,
          assigned: conversation.assigned,
          read: conversation.read,
          updatedAt: conversation.updatedAt,
          createdAt: conversation.createdAt
        },
        contact: conversation.contact && conversation.contact.length > 0 ? {
          id: conversation.contact[0].id,
          firstName: conversation.contact[0].firstName,
          lastName: conversation.contact[0].lastName,
          email: conversation.contact[0].email
        } : null,
        messages: {
          total: allMessages.length,
          counts: messageCounts,
          recent: allMessages.slice(0, 5).map(msg => ({
            id: msg.id,
            message: msg.message,
            type: msg.type,
            fromCustomer: msg.fromCustomer,
            isBot: msg.isBot,
            createdAt: msg.createdAt,
            status: msg.status
          }))
        }
      }
    });

  } catch (error) {
    console.error('Debug conversation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
