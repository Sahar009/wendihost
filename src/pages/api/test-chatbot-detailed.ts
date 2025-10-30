import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import chatbotFlow from '@/services/chatbot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🧪 DETAILED TEST: Testing message:', message);

    // Get the current conversation
    let conversation = await prisma.conversation.findFirst({
      where: { phone: '+2348101126131', workspaceId: 1 }
    });

    if (!conversation) {
      return res.status(400).json({ error: 'Conversation not found' });
    }

    console.log('🧪 DETAILED TEST: Before chatbot flow:', {
      id: conversation.id,
      chatbotId: conversation.chatbotId,
      currentNode: conversation.currentNode,
      status: conversation.status
    });

    // Call chatbot flow with error handling
    let chatbotTriggered = false;
    let error = null;
    
    try {
      chatbotTriggered = await chatbotFlow(conversation, message, false);
      console.log('🧪 DETAILED TEST: Chatbot flow result:', chatbotTriggered);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      console.error('🧪 DETAILED TEST: Chatbot flow error:', e);
    }

    // Reload conversation to see if it was updated
    conversation = await prisma.conversation.findFirst({
      where: { phone: '+2348101126131', workspaceId: 1 }
    });

    console.log('🧪 DETAILED TEST: After chatbot flow:', {
      id: conversation?.id,
      chatbotId: conversation?.chatbotId,
      currentNode: conversation?.currentNode,
      status: conversation?.status,
      chatbotTriggered,
      error
    });

    return res.status(200).json({
      success: true,
      message,
      conversationBefore: conversation,
      chatbotTriggered,
      error,
      conversationAfter: conversation
    });

  } catch (error) {
    console.error('🧪 DETAILED TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

