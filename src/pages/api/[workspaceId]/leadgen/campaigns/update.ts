import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface UpdateCampaignRequest extends NextApiRequest {
  body: {
    id: number;
    name?: string;
    description?: string;
    status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    businessType?: string;
    location?: string;
    radius?: number;
    maxResults?: number;
    messageTemplate?: string;
    landingPageId?: number;
  };
}

export default withIronSessionApiRoute(
  async function updateCampaign(req: UpdateCampaignRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { id, ...updateData } = req.body;

      if (!id) {
        return new ServerError(res, 400, 'Campaign ID is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Check if campaign exists and belongs to workspace
      const existingCampaign = await prisma.leadCampaign.findFirst({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId),
        },
      });

      if (!existingCampaign) {
        return new ServerError(res, 404, 'Campaign not found');
      }

      // Update campaign
      const campaign = await prisma.leadCampaign.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          landingPage: true,
        },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Campaign updated successfully',
        data: campaign,
      });
    } catch (error) {
      console.error('Error in campaigns/update:', error);
      return new ServerError(res, 500, 'Failed to update campaign');
    }
  },
  sessionCookie()
);
