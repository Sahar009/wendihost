import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getLeadGenStats(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Get total leads
      const totalLeads = await prisma.lead.count({
        where: { workspaceId: Number(workspaceId) },
      });

      // Get active campaigns
      const activeCampaigns = await prisma.leadCampaign.count({
        where: {
          workspaceId: Number(workspaceId),
          status: 'ACTIVE',
        },
      });

      // Get contacted leads
      const contactedLeads = await prisma.lead.count({
        where: {
          workspaceId: Number(workspaceId),
          status: { in: ['CONTACTED', 'INTERESTED', 'CONVERTED'] },
        },
      });

      // Get converted leads
      const convertedLeads = await prisma.lead.count({
        where: {
          workspaceId: Number(workspaceId),
          status: 'CONVERTED',
        },
      });

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 
        ? Math.round((convertedLeads / totalLeads) * 100) 
        : 0;

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Stats fetched successfully',
        data: {
          totalLeads,
          activeCampaigns,
          totalContacted: contactedLeads,
          conversionRate,
        },
      });
    } catch (error) {
      console.error('Error in leadgen/stats:', error);
      return new ServerError(res, 500, 'Failed to fetch stats');
    }
  },
  sessionCookie()
);
