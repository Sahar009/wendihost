import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface CreateCampaignRequest extends NextApiRequest {
  body: {
    name: string;
    description?: string;
    businessType?: string;
    location?: string;
    radius?: number;
    maxResults?: number;
    messageTemplate?: string;
    landingPageId?: number;
  };
}

export default withIronSessionApiRoute(
  async function createCampaign(req: CreateCampaignRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const {
        name,
        description,
        businessType,
        location,
        radius,
        maxResults,
        messageTemplate,
        landingPageId,
      } = req.body;

      if (!name) {
        return new ServerError(res, 400, 'Campaign name is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { user } = validatedInfo;

      const campaign = await prisma.leadCampaign.create({
        data: {
          name,
          description,
          businessType,
          location,
          radius,
          maxResults: maxResults || 50,
          messageTemplate,
          landingPageId,
          status: 'DRAFT',
          workspaceId: Number(workspaceId),
          userId: user.id,
        },
        include: {
          landingPage: true,
        },
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Campaign created successfully',
        data: campaign,
      });
    } catch (error) {
      console.error('Error in campaigns/create:', error);
      return new ServerError(res, 500, 'Failed to create campaign');
    }
  },
  sessionCookie()
);
