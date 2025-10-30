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
    
    console.log('Fetching monthly clicks for workspaceId:', id);
    
    const now = new Date();
    const year = now.getFullYear();
    const monthlyCounts = Array(12).fill(0);

    try {
      const clicks = await prisma.whatsappLinkClick.findMany({
        where: {
          workspaceId: id,
          createdAt: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
        select: { createdAt: true },
      });

      console.log('Found clicks:', clicks.length);

      clicks.forEach(click => {
        const month = click.createdAt.getMonth(); // 0 = Jan
        monthlyCounts[month]++;
      });

      console.log('Monthly counts:', monthlyCounts);
      res.status(200).json({ monthlyClicks: monthlyCounts });
      
    } catch (dbError: any) {
      console.error('Database error in metrics-link-clicks:', dbError);
      
      if (dbError.message?.includes('WhatsappLinkClick') || 
          dbError.code === 'P2021' || 
          dbError.message?.includes('relation "WhatsappLinkClick" does not exist')) {
        console.log('WhatsappLinkClick table does not exist, returning empty data');
        res.status(200).json({ monthlyClicks: monthlyCounts });
      } else {
        throw dbError;
      }
    }
    
  } catch (error) {
    console.error('Error in metrics-link-clicks API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly link clicks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
