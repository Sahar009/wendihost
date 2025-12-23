import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { FACEBOOK_BASE_ENDPOINT } from '@/libs/constants';

export default withIronSessionApiRoute(
  async function getFacebookTemplates(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { workspace } = validatedInfo;

      if (!workspace.accessToken) {
        return new ServerError(res, 400, 'Facebook account not connected');
      }

      if (!workspace.fbUserId) {
        return new ServerError(res, 400, 'Facebook user ID not found. Please reconnect your Facebook account.');
      }

      // Fetch ad creative templates from Facebook Graph API
      try {
        const adAccountId = `act_${String(workspace.fbUserId)}`;
        const endpoint = `${FACEBOOK_BASE_ENDPOINT}${adAccountId}/adcreatives`;
        
        console.log('Fetching Facebook ad templates:', {
          adAccountId,
          endpoint,
          hasAccessToken: !!workspace.accessToken
        });

        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${workspace.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,object_story_spec,image_url,thumbnail_url,status,effective_object_story_id',
            limit: 50
          }
        });

        console.log('Facebook templates API response:', {
          hasData: !!response.data.data,
          dataLength: response.data.data?.length || 0
        });

        const templates = response.data.data || [];

        // Transform templates to a more usable format
        const formattedTemplates = templates.map((template: any) => {
          const linkData = template.object_story_spec?.link_data || {};
          const videoData = template.object_story_spec?.video_data || {};
          
          return {
            id: template.id,
            name: template.name,
            message: linkData.message || videoData.message || '',
            imageUrl: template.image_url || template.thumbnail_url || linkData.picture || '',
            callToAction: linkData.call_to_action?.type || videoData.call_to_action?.type || '',
            link: linkData.link || '',
            status: template.status,
            effectiveObjectStoryId: template.effective_object_story_id
          };
        });

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Templates fetched successfully',
          data: formattedTemplates
        });
      } catch (error: any) {
        console.error('Error fetching Facebook templates:', {
          error: error.response?.data || error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          endpoint: error.config?.url
        });
        
        const errorMessage = error.response?.data?.error?.message || 'Failed to fetch Facebook templates';
        const errorCode = error.response?.data?.error?.code;
        
        if (errorCode === 200 || errorMessage.includes('permission') || errorMessage.includes('scope')) {
          return new ServerError(
            res, 
            403, 
            'Access token does not have permission to view ad creatives. Please ensure ads_management permission is granted.'
          );
        }
        
        return new ServerError(
          res, 
          500, 
          errorMessage
        );
      }
    } catch (error) {
      console.error('Error in metaads/templates:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
);
