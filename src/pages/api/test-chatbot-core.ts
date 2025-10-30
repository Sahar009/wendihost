import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the current conversation
    const conversation = await prisma.conversation.findFirst({
      where: { phone: '+2348101126131', workspaceId: 1 }
    });

    if (!conversation || !conversation.chatbotId || !conversation.currentNode) {
      return res.status(400).json({ error: 'No active chatbot conversation' });
    }

    // Get the chatbot configuration
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: conversation.chatbotId },
      select: { bot: true }
    });

    if (!chatbot || !chatbot.bot) {
      return res.status(400).json({ error: 'No bot config' });
    }

    const botConfig = JSON.parse(chatbot.bot as string);
    const currentNode = botConfig[conversation.currentNode];

    if (!currentNode) {
      return res.status(400).json({ error: 'Current node not found' });
    }

    // Test the core logic without sending messages
    const children = currentNode.children || [];
    const option = Number(message);
    const isValidOption = !isNaN(option) && option >= 1 && option <= children.length;
    
    if (!isValidOption) {
      return res.status(400).json({ 
        error: 'Invalid option',
        parsedOption: option,
        validRange: `1-${children.length}`
      });
    }

    const selectedChild = children[option - 1];
    const nextNodeId = selectedChild.next;
    const nextNode = botConfig[nextNodeId];

    if (!nextNode) {
      return res.status(400).json({ 
        error: 'Next node not found',
        nextNodeId,
        availableNodes: Object.keys(botConfig)
      });
    }

    // Simulate what should happen - update the conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { currentNode: nextNodeId }
    });

    return res.status(200).json({
      success: true,
      message,
      option,
      selectedChild: {
        message: selectedChild.message,
        next: selectedChild.next
      },
      nextNode: {
        id: nextNodeId,
        type: nextNode.type,
        message: nextNode.message
      },
      conversationUpdated: true
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

