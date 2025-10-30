import { NextApiRequest, NextApiResponse } from 'next';
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

    console.log('🧪 TEST: Testing chatbot with message:', message);

    // Create a mock conversation object for testing
    const mockConversation = {
      id: 1,
      phone: '+2348101126131',
      status: 'open' as const,
      chatbotId: null,
      currentNode: null,
      chatbotTimeout: null,
      workspaceId: 1,
      assigned: false,
      read: false,
      source: 'DIRECT' as const,
      campaignId: null,
      widgetId: null,
      metaAdId: null,
      memberId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Call chatbot flow directly
    const result = await chatbotFlow(mockConversation, message, false);

    return res.status(200).json({
      success: true,
      message: message,
      chatbotTriggered: result,
      mockConversation: mockConversation
    });

  } catch (error) {
    console.error('🧪 TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

