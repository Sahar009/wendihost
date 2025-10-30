import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    console.log(`Getting conversations for workspace ${workspaceId}`);

    // Get all conversations for this workspace
    const conversations = await prisma.conversation.findMany({
      where: { 
        workspaceId: Number(workspaceId)
      },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only get the last message
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`Found ${conversations.length} conversations`);

    // Format the response
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      phone: conv.phone,
      status: conv.status,
      assigned: conv.assigned,
      read: conv.read,
      updatedAt: conv.updatedAt,
      contact: conv.contact ? {
        id: (conv.contact as any).id,
        firstName: (conv.contact as any).firstName,
        lastName: (conv.contact as any).lastName
      } : null,
      lastMessage: conv.messages[0] ? {
        id: conv.messages[0].id,
        message: conv.messages[0].message,
        type: conv.messages[0].type,
        fromCustomer: conv.messages[0].fromCustomer,
        createdAt: conv.messages[0].createdAt
      } : null
    }));

    return res.json({
      success: true,
      message: `Found ${conversations.length} conversations`,
      data: {
        conversations: formattedConversations,
        total: conversations.length
      }
    });

  } catch (error) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
