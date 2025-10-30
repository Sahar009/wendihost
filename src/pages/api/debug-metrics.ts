
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  
  if (!workspaceId) {
    return res.status(400).json({ error: 'workspaceId is required' });
  }

  try {
    const workspaceIdNum = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;
    const id = isNaN(Number(workspaceIdNum)) ? 0 : Number(workspaceIdNum);

    console.log('Debug metrics for workspaceId:', id);

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: id }
    });
    console.log('Workspace exists:', !!workspace);

    // Check all chatbots
    const allChatbots = await prisma.chatbot.findMany();
    console.log('Total chatbots in database:', allChatbots.length);
    console.log('All chatbots:', allChatbots.map(c => ({ id: c.id, name: c.name, workspaceId: c.workspaceId })));

    // Check chatbots for this workspace
    const chatbots = await prisma.chatbot.findMany({ 
      where: { workspaceId: id } 
    });
    console.log('Chatbots for workspace', id, ':', chatbots.length);
    console.log('Chatbots details:', chatbots.map(c => ({ id: c.id, name: c.name, workspaceId: c.workspaceId })));

    // Check contacts
    const contacts = await prisma.contact.count({ where: { workspaceId: id } });
    console.log('Contacts for workspace', id, ':', contacts);

    // Check whatsapp links
    const whatsappLinks = await prisma.whatsappLink.findMany({ where: { workspaceId: id } });
    console.log('WhatsApp links for workspace', id, ':', whatsappLinks.length);

    res.status(200).json({
      workspaceId: id,
      workspaceExists: !!workspace,
      totalChatbotsInDb: allChatbots.length,
      allChatbots: allChatbots.map(c => ({ id: c.id, name: c.name, workspaceId: c.workspaceId })),
      chatbotsForWorkspace: chatbots.length,
      chatbots: chatbots.map(c => ({ id: c.id, name: c.name, workspaceId: c.workspaceId })),
      contacts,
      whatsappLinks: whatsappLinks.length
    });
  } catch (error) {
    console.error('Debug metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch debug metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
