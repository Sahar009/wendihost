import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface GetMetaAdByIdRequest extends NextApiRequest {
  query: {
    id: string;
    workspaceId: string;
  };
}

export default withIronSessionApiRoute(
  async function getMetaAdById(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { id, workspaceId } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const metaAd = await prisma.metaAd.findFirst({
        where: {
          id: id as string,
          workspaceId: Number(workspaceId),
        },
        select: {
          id: true,
          adName: true,
          adType: true,
          color: true,
          objective: true,
          targetAudience: true,
          budget: true,
          startDate: true,
          endDate: true,
          mediaUrl: true,
          adText: true,
          cta: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!metaAd) {
        return new ServerError(res, 404, 'MetaAd not found');
      }

      const stats = [
        { label: 'Impression', value: 0 },
        { label: 'Spend', value: 0 },
        { label: 'Reach', value: 0 },
        { label: 'Clicks', value: 0 },
        { label: 'Leads', value: 0 },
      ];

      const transformedAd = {
        id: metaAd.id,
        name: metaAd.adName,
        status: 'DRAFT',
        reach: 0, 
        createdAt: metaAd.createdAt.toLocaleDateString(),
        adType: metaAd.adType,
        color: metaAd.color,
        objective: metaAd.objective,
        targetAudience: metaAd.targetAudience,
        budget: metaAd.budget,
        startDate: metaAd.startDate,
        endDate: metaAd.endDate,
        mediaUrl: metaAd.mediaUrl,
        adText: metaAd.adText,
        cta: metaAd.cta,
        phoneNumber: metaAd.phoneNumber,
        facebookAdId: null,
        campaignId: null, 
        adSetId: null, 
        creativeId: null, 
        workspace: { id: Number(workspaceId), name: 'Workspace' },
        user: { id: 0, firstName: 'User', lastName: 'Name' }, 
        stats,
      };

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'MetaAd retrieved successfully',
        data: transformedAd
      });
    } catch (error) {
      console.error('Error in metaads/[id]/get:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
); 