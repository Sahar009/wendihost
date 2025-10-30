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

    console.log('🧪 OPTION TEST: Testing message:', message);

    // Get the current conversation
    const conversation = await prisma.conversation.findFirst({
      where: { phone: '+2348101126131', workspaceId: 1 }
    });

    if (!conversation || !conversation.chatbotId || !conversation.currentNode) {
      return res.status(400).json({ 
        error: 'No active chatbot conversation found',
        conversation: conversation ? {
          id: conversation.id,
          chatbotId: conversation.chatbotId,
          currentNode: conversation.currentNode,
          status: conversation.status
        } : null
      });
    }

    // Get the chatbot configuration
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: conversation.chatbotId },
      select: { bot: true }
    });

    if (!chatbot || !chatbot.bot) {
      return res.status(400).json({ error: 'Chatbot configuration not found' });
    }

    const botConfig = JSON.parse(chatbot.bot as string);
    const currentNode = botConfig[conversation.currentNode];

    if (!currentNode) {
      return res.status(400).json({ 
        error: 'Current node not found in bot config',
        currentNodeId: conversation.currentNode,
        availableNodes: Object.keys(botConfig)
      });
    }

    console.log('🧪 OPTION TEST: Current node:', {
      id: conversation.currentNode,
      type: currentNode.type,
      message: currentNode.message,
      childrenCount: currentNode.children?.length || 0
    });

    // Simulate the handleMsgOption logic
    const children = currentNode.children || [];
    const option = Number(message);

    console.log('🧪 OPTION TEST: Parsed option:', option, 'from message:', message);
    console.log('🧪 OPTION TEST: Children available:', children.map((child: any, index: number) => ({
      index: index + 1,
      message: child.message,
      next: child.next
    })));

    let selectedChild = null;
    if (!isNaN(option) && option >= 1 && option <= children.length) {
      selectedChild = children[option - 1];
      console.log('🧪 OPTION TEST: Selected child:', {
        option,
        message: selectedChild.message,
        next: selectedChild.next
      });
    } else {
      console.log('🧪 OPTION TEST: Invalid option:', option, 'Valid range: 1 to', children.length);
    }

    return res.status(200).json({
      success: true,
      message,
      conversation: {
        id: conversation.id,
        chatbotId: conversation.chatbotId,
        currentNode: conversation.currentNode,
        status: conversation.status
      },
      currentNode: {
        id: conversation.currentNode,
        type: currentNode.type,
        message: currentNode.message,
        children: children.map((child: any, index: number) => ({
          option: index + 1,
          message: child.message,
          next: child.next
        }))
      },
      optionHandling: {
        parsedOption: option,
        isValidOption: !isNaN(option) && option >= 1 && option <= children.length,
        selectedChild: selectedChild ? {
          message: selectedChild.message,
          next: selectedChild.next
        } : null
      }
    });

  } catch (error) {
    console.error('🧪 OPTION TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

