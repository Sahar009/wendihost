import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getLeads(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, id, status, campaignId, search } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Get single lead by ID
      if (id) {
        const lead = await prisma.lead.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
            outreachLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            formSubmissions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        });

        if (!lead) {
          return new ServerError(res, 404, 'Lead not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Lead fetched successfully',
          data: lead,
        });
      }

      // Build filter conditions
      const where: any = {
        workspaceId: Number(workspaceId),
      };

      if (status) {
        where.status = status;
      }

      if (campaignId) {
        where.campaignId = Number(campaignId);
      }

      if (search) {
        where.OR = [
          { businessName: { contains: String(search), mode: 'insensitive' } },
          { phoneNumber: { contains: String(search) } },
          { email: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      // Get all leads with filters
      const leads = await prisma.lead.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              outreachLogs: true,
              formSubmissions: true,
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
        message: 'Leads fetched successfully',
        data: leads,
      });
    } catch (error) {
      console.error('Error in leads/get:', error);
      return new ServerError(res, 500, 'Failed to fetch leads');
    }
  },
  sessionCookie()
);
