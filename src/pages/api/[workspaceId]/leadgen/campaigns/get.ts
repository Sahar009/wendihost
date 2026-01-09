import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getCampaigns(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, id } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Get single campaign by ID
      if (id) {
        const campaign = await prisma.leadCampaign.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
          include: {
            landingPage: true,
            leads: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                leads: true,
                outreachLogs: true,
              },
            },
          },
        });

        if (!campaign) {
          return new ServerError(res, 404, 'Campaign not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Campaign fetched successfully',
          data: campaign,
        });
      }

      // Get all campaigns
      const campaigns = await prisma.leadCampaign.findMany({
        where: {
          workspaceId: Number(workspaceId),
        },
        include: {
          landingPage: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              leads: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Campaigns fetched successfully',
        data: campaigns,
      });
    } catch (error) {
      console.error('Error in campaigns/get:', error);
      return new ServerError(res, 500, 'Failed to fetch campaigns');
    }
  },
  sessionCookie()
);
