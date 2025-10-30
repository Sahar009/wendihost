import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 DB TEST: Checking chatbots in database...');

    // Get all chatbots for workspace ID 1
    const chatbots = await prisma.chatbot.findMany({
      where: { workspaceId: 1 },
      select: {
        id: true,
        name: true,
        trigger: true,
        publish: true,
        default: true,
        bot: false // Don't include the full bot config to keep response small
      }
    });

    console.log('🧪 DB TEST: Found chatbots:', chatbots);

    // Also check if there are any chatbots at all
    const allChatbots = await prisma.chatbot.findMany({
      select: {
        id: true,
        name: true,
        trigger: true,
        publish: true,
        default: true,
        workspaceId: true
      }
    });

    // Check workspace
    const workspace = await prisma.workspace.findFirst({
      where: { id: 1 },
      select: {
        id: true,
        name: true
      }
    });

    return res.status(200).json({
      success: true,
      workspace,
      chatbotsInWorkspace1: chatbots,
      allChatbots: allChatbots,
      totalChatbots: allChatbots.length,
      chatbotsInWorkspace1Count: chatbots.length
    });

  } catch (error) {
    console.error('🧪 DB TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

