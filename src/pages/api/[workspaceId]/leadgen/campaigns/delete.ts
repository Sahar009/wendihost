import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function deleteCampaign(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'DELETE') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, id } = req.query;

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

      // Delete campaign (cascade will handle related records)
      await prisma.leadCampaign.delete({
        where: { id: Number(id) },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Campaign deleted successfully',
        data: null,
      });
    } catch (error) {
      console.error('Error in campaigns/delete:', error);
      return new ServerError(res, 500, 'Failed to delete campaign');
    }
  },
  sessionCookie()
);
