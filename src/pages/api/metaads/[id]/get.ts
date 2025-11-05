import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';

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
          facebookAdId: true,
          campaignId: true,
          adSetId: true,
          creativeId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!metaAd) {
        return new ServerError(res, 404, 'MetaAd not found');
      }

      // Fetch Facebook Insights if we have the Facebook Ad ID
      let stats = [
        { label: 'Impression', value: 0 },
        { label: 'Spend', value: 0 },
        { label: 'Reach', value: 0 },
        { label: 'Clicks', value: 0 },
        { label: 'Leads', value: 0 },
      ];
      let reach = 0;

      if (metaAd.facebookAdId && validatedInfo.workspace.accessToken) {
        try {
          // Fetch insights using Facebook Graph API directly
          const insightsResponse = await axios.get(
            `https://graph.facebook.com/v21.0/${metaAd.facebookAdId}/insights`,
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
            reach = parseInt(data.reach || '0');
            
            let leads = 0;
            if (data.actions) {
              const leadActions = data.actions.filter((action: any) => 
                action.action_type === 'lead' || action.action_type === 'onsite_conversion.lead_generation'
              );
              leads = leadActions.reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0);
            }

            stats = [
              { label: 'Impression', value: impressions },
              { label: 'Spend', value: spend },
              { label: 'Reach', value: reach },
              { label: 'Clicks', value: clicks },
              { label: 'Leads', value: leads },
            ];
          }
        } catch (insightError) {
          console.error('Error fetching Facebook Insights:', insightError);
          // Continue with zero stats if fetch fails
        }
      }

      const transformedAd = {
        id: metaAd.id,
        name: metaAd.adName,
        status: metaAd.status || 'DRAFT',
        reach: reach, 
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
        facebookAdId: metaAd.facebookAdId,
        campaignId: metaAd.campaignId, 
        adSetId: metaAd.adSetId, 
        creativeId: metaAd.creativeId, 
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