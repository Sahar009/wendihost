import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface GetMetaAdsQuery {
  workspaceId: string;
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  [key: string]: string | string[] | undefined;
}

export default withIronSessionApiRoute(
  async function getMetaAds(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, page = '1', limit = '10', search, status } = req.query as GetMetaAdsQuery;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      const where: any = {
        workspaceId: Number(workspaceId),
      };

      if (search) {
        where.OR = [
          { adName: { contains: search, mode: 'insensitive' } },
          { adText: { contains: search, mode: 'insensitive' } },
          { targetAudience: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const totalCount = await prisma.metaAd.count({ where });

      const metaAds = await prisma.metaAd.findMany({
        where,
        select: {
          id: true,
          adName: true,
          adType: true,
          status: true,
          budget: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNumber,
      });

      const transformedAds = metaAds.map(ad => ({
        id: ad.id,
        name: ad.adName,
        status: ad.status,
        reach: 0, 
        createdAt: ad.createdAt.toLocaleDateString(),
        adType: ad.adType,
        budget: ad.budget,
        startDate: ad.startDate,
        endDate: ad.endDate,
      }));

      const stats = [
        { label: 'Impression', value: 0 },
        { label: 'Spend', value: 0 },
        { label: 'Reach', value: 0 },
        { label: 'Clicks', value: 0 },
        { label: 'Leads', value: 0 },
      ];

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'MetaAds retrieved successfully',
        data: {
          ads: transformedAds,
          stats,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitNumber),
          }
        }
      });
    } catch (error) {
      console.error('Error in metaads/get:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
); 