import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import chatbotFlow from '@/services/chatbot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, phone = '+2348101126131' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🧪 PROGRESSION TEST: Testing message:', message, 'for phone:', phone);

    // Find or create conversation for the test phone number
    let conversation = await prisma.conversation.findFirst({
      where: { phone, workspaceId: 1 }
    });

    // If no conversation exists, create one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          phone,
          workspaceId: 1,
          status: 'open',
          source: 'DIRECT'
        }
      });
      console.log('🧪 PROGRESSION TEST: Created new conversation:', conversation.id);
    }

    console.log('🧪 PROGRESSION TEST: Found conversation:', {
      id: conversation.id,
      chatbotId: conversation.chatbotId,
      currentNode: conversation.currentNode,
      status: conversation.status
    });

    // Get messages before chatbot flow
    const messagesBefore = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' }
    });

    // Call chatbot flow
    const chatbotTriggered = await chatbotFlow(conversation!, message, false);
    
    // Get messages after chatbot flow
    const messagesAfter = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' }
    });

    // Reload conversation to see if it was updated
    const updatedConversation = await prisma.conversation.findFirst({
      where: { phone, workspaceId: 1 }
    });

    // Analyze new messages
    const newMessages = messagesAfter.slice(0, messagesAfter.length - messagesBefore.length);

    console.log('🧪 PROGRESSION TEST: After chatbot flow:', {
      id: updatedConversation?.id,
      chatbotId: updatedConversation?.chatbotId,
      currentNode: updatedConversation?.currentNode,
      status: updatedConversation?.status,
      chatbotTriggered,
      newMessagesCount: newMessages.length
    });

    // Check if bless chatbot was found
    const blessChatbot = await prisma.chatbot.findFirst({
      where: {
        workspaceId: 1,
        trigger: 'bless'
      }
    });

    return res.status(200).json({
      success: true,
      message,
      phone,
      conversationBefore: conversation,
      conversationAfter: updatedConversation,
      chatbotTriggered,
      newMessages: newMessages.map(msg => ({
        message: msg.message,
        fromCustomer: msg.fromCustomer,
        isBot: msg.isBot,
        fileType: msg.fileType,
        createdAt: msg.createdAt
      })),
      newMessagesCount: newMessages.length,
      blessChatbotFound: !!blessChatbot,
      blessChatbotName: blessChatbot?.name || null,
      analysis: {
        stateChanged: conversation.currentNode !== updatedConversation?.currentNode,
        currentNodeBefore: conversation.currentNode,
        currentNodeAfter: updatedConversation?.currentNode,
        statusChanged: conversation.status !== updatedConversation?.status,
        statusBefore: conversation.status,
        statusAfter: updatedConversation?.status
      }
    });

  } catch (error) {
    console.error('🧪 PROGRESSION TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

