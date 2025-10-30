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

    console.log('Fetching metrics for workspaceId:', id);
    console.log('Raw workspaceId from query:', workspaceId);
    console.log('Parsed workspaceId:', id);

    const contacts = await prisma.contact.count({ where: { workspaceId: id } });
    console.log('Contacts count:', contacts);

    const whatsappLinks = await prisma.whatsappLink.findMany({ where: { workspaceId: id } });
    const whatsappLinkClicks = whatsappLinks.reduce((sum, link) => sum + (link.visitors || 0), 0);
    console.log('WhatsApp links count:', whatsappLinks.length, 'Total clicks:', whatsappLinkClicks);

    const chatbots = await prisma.chatbot.count({ where: { workspaceId: id } });
    console.log('Chatbots count:', chatbots);

    // Debug: Let's also check if there are any chatbots at all
    const allChatbots = await prisma.chatbot.findMany();
    console.log('Total chatbots in database:', allChatbots.length);

    res.status(200).json({ contacts, whatsappLinkClicks, chatbots });
  } catch (error) {
    console.error('Metrics API error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}
