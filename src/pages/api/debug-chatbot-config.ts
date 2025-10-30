import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the chatbot configuration for ID 2
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: 2 },
      select: { id: true, name: true, trigger: true, bot: true }
    });

    if (!chatbot || !chatbot.bot) {
      return res.status(404).json({ error: 'Chatbot not found or no bot config' });
    }

    const botConfig = JSON.parse(chatbot.bot as string);
    
    // Get the current node from the conversation
    const conversation = await prisma.conversation.findFirst({
      where: { phone: '+2348101126131', workspaceId: 1 }
    });

    const currentNodeId = conversation?.currentNode;
    const currentNode = currentNodeId ? botConfig[currentNodeId] : null;

    return res.status(200).json({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        trigger: chatbot.trigger
      },
      conversation: {
        currentNode: currentNodeId,
        status: conversation?.status
      },
      botNodes: Object.keys(botConfig),
      currentNodeConfig: currentNode ? {
        id: currentNodeId,
        type: currentNode.type,
        message: currentNode.message,
        children: currentNode.children?.map((child: any, index: number) => ({
          option: index + 1,
          message: child.message,
          next: child.next
        })) || []
      } : null,
      fullBotConfig: botConfig
    });

  } catch (error) {
    console.error('Debug chatbot config error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

