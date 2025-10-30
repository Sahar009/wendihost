import { NextApiRequest, NextApiResponse } from 'next';
import { AutomationService } from '@/services/automation';
import chatbotFlow from '@/services/chatbot';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, phone = '+2348101126131', workspaceId = 1 } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🧪 AUTOMATION TEST: Testing automation with message:', message, 'phone:', phone);

    // Get or create real conversation from database
    let conversation = await prisma.conversation.findFirst({
      where: {
        phone: phone,
        workspaceId: workspaceId
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          phone: phone,
          workspaceId: workspaceId,
          status: 'open',
          read: false,
          source: 'DIRECT'
        }
      });
      console.log('🧪 AUTOMATION TEST: Created new conversation:', conversation.id);
    } else {
      console.log('🧪 AUTOMATION TEST: Found existing conversation:', conversation.id);
    }

    // Step 1: Test chatbot first (like the real webhook does)
    console.log('🧪 AUTOMATION TEST: Testing chatbot flow first...');
    const chatbotTriggered = await chatbotFlow(conversation, message, false);
    console.log('🧪 AUTOMATION TEST: Chatbot triggered:', chatbotTriggered);

    let automationResult = null;
    if (!chatbotTriggered) {
      // Step 2: Test automation only if chatbot didn't trigger
      console.log('🧪 AUTOMATION TEST: Chatbot not triggered, testing automation...');
      
      const automationService = new AutomationService(workspaceId);
      
      console.log('🧪 AUTOMATION TEST: Getting automation settings...');
      const settings = await automationService.getSettings();
      
      console.log('🧪 AUTOMATION TEST: Settings loaded:', {
        hasSettings: !!settings,
        holidayMode: settings?.holidayMode,
        rulesCount: settings?.automationRules?.length || 0,
        rules: settings?.automationRules?.map(r => ({
          id: r.id,
          enabled: r.enabled,
          type: r.responseType,
          description: r.description,
          aiPrompt: r.aiPrompt?.substring(0, 50) + '...'
        })) || []
      });

      if (settings) {
        console.log('🧪 AUTOMATION TEST: Calling getAutomatedResponse...');
        automationResult = await automationService.getAutomatedResponse(
          conversation.phone,
          message,
          conversation,
          settings
        );
        console.log('🧪 AUTOMATION TEST: Automation result:', automationResult);
      }
    } else {
      console.log('🧪 AUTOMATION TEST: Chatbot triggered, skipping automation');
    }

    return res.status(200).json({
      success: true,
      message,
      workspaceId,
      chatbotTriggered,
      automationResult,
      conversation: conversation
    });

  } catch (error) {
    console.error('🧪 AUTOMATION TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
