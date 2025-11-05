import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';

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
          facebookAdId: true,
          campaignId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNumber,
      });

      // Calculate aggregate stats from all ads
      let totalImpressions = 0;
      let totalSpend = 0;
      let totalReach = 0;
      let totalClicks = 0;
      let totalLeads = 0;

      const transformedAds = await Promise.all(metaAds.map(async (ad) => {
        let adReach = 0;
        
        // Fetch insights for each ad if we have Facebook ID
        if (ad.facebookAdId && validatedInfo.workspace.accessToken) {
          try {
            // Fetch insights using Facebook Graph API directly
            const insightsResponse = await axios.get(
              `https://graph.facebook.com/v21.0/${ad.facebookAdId}/insights`,
              {
                params: {
                  fields: 'impressions,reach,clicks,spend,actions',
                  access_token: validatedInfo.workspace.accessToken
                }
              }
            );

            if (insightsResponse.data && insightsResponse.data.data && insightsResponse.data.data.length > 0) {
              const data = insightsResponse.data.data[0];
              const impressions = parseInt(data.impressions || '0');
              const clicks = parseInt(data.clicks || '0');
              const spend = parseFloat(data.spend || '0');
              adReach = parseInt(data.reach || '0');
              
              let leads = 0;
              if (data.actions) {
                const leadActions = data.actions.filter((action: any) => 
                  action.action_type === 'lead' || action.action_type === 'onsite_conversion.lead_generation'
                );
                leads = leadActions.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0);
              }

              totalImpressions += impressions;
              totalSpend += spend;
              totalReach += adReach;
              totalClicks += clicks;
              totalLeads += leads;
            }
          } catch (insightError) {
            console.error(`Error fetching insights for ad ${ad.id}:`, insightError);
          }
        }

        return {
          id: ad.id,
          name: ad.adName,
          status: ad.status,
          reach: adReach,
          createdAt: ad.createdAt.toLocaleDateString(),
          adType: ad.adType,
          budget: ad.budget,
          startDate: ad.startDate,
          endDate: ad.endDate,
        };
      }));

      const stats = [
        { label: 'Impression', value: totalImpressions },
        { label: 'Spend', value: totalSpend },
        { label: 'Reach', value: totalReach },
        { label: 'Clicks', value: totalClicks },
        { label: 'Leads', value: totalLeads },
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