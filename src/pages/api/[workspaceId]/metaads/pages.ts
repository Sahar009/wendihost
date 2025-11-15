import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { FACEBOOK_BASE_ENDPOINT } from '@/libs/constants';

export default withIronSessionApiRoute(
  async function getFacebookPages(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
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

      // Fetch pages from Facebook Graph API
      try {
        // First, debug the token to see what permissions it has
        let tokenInfo = null;
        try {
          const debugResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}debug_token`, {
            params: {
              input_token: workspace.accessToken,
              access_token: workspace.accessToken
            }
          });
          tokenInfo = debugResponse.data.data;
          console.log('Token debug info:', {
            appId: tokenInfo.app_id,
            userId: tokenInfo.user_id,
            scopes: tokenInfo.scopes,
            type: tokenInfo.type,
            isValid: tokenInfo.is_valid
          });
        } catch (debugError) {
          console.warn('Could not debug token:', debugError);
        }

        // Try using fbUserId if available, otherwise use 'me'
        const userId = workspace.fbUserId ? String(workspace.fbUserId) : (tokenInfo?.user_id ? String(tokenInfo.user_id) : 'me');
        const endpoint = `${FACEBOOK_BASE_ENDPOINT}${userId}/accounts`;
        
        console.log('Fetching Facebook pages:', {
          userId,
          endpoint,
          hasAccessToken: !!workspace.accessToken,
          fbUserId: workspace.fbUserId,
          tokenUserId: tokenInfo?.user_id
        });

        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${workspace.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,category,access_token',
            limit: 100
          }
        });

        console.log('Facebook API response:', {
          hasData: !!response.data.data,
          dataLength: response.data.data?.length || 0,
          fullResponse: JSON.stringify(response.data).substring(0, 500)
        });

        const pages = response.data.data || [];

        // If no pages found with userId, try 'me' as fallback
        if (pages.length === 0 && userId !== 'me') {
          console.log('No pages found with fbUserId, trying "me" endpoint...');
          try {
            const meResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}me/accounts`, {
              headers: {
                'Authorization': `Bearer ${workspace.accessToken}`,
                'Content-Type': 'application/json'
              },
              params: {
                fields: 'id,name,category,access_token',
                limit: 100
              }
            });
            
            const mePages = meResponse.data.data || [];
            console.log('Pages from "me" endpoint:', mePages.length);
            
            if (mePages.length > 0) {
              return res.status(200).json({
                status: 'success',
                statusCode: 200,
                message: 'Pages fetched successfully',
                data: mePages.map((page: any) => ({
                  id: page.id,
                  name: page.name,
                  category: page.category,
                  accessToken: page.access_token
                }))
              });
            }
          } catch (meError) {
            console.warn('Error fetching pages from "me" endpoint:', meError);
          }
        }

        // If still no pages and token is a system user token, return helpful message
        if (pages.length === 0 && tokenInfo?.type === 'SYSTEM_USER') {
          return res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'No pages found. The WhatsApp Business access token does not have permission to view pages. Please connect your Facebook account separately for Meta Ads.',
            data: []
          });
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Pages fetched successfully',
          data: pages.map((page: any) => ({
            id: page.id,
            name: page.name,
            category: page.category,
            accessToken: page.access_token
          }))
        });
      } catch (error: any) {
        console.error('Error fetching Facebook pages:', {
          error: error.response?.data || error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          endpoint: error.config?.url
        });
        
        // Check if it's a permission error
        const errorMessage = error.response?.data?.error?.message || 'Failed to fetch Facebook pages';
        const errorCode = error.response?.data?.error?.code;
        
        if (errorCode === 200 || errorMessage.includes('permission') || errorMessage.includes('scope')) {
          return new ServerError(
            res, 
            403, 
            'Access token does not have permission to view pages. Please reconnect your Facebook account with pages_show_list permission.'
          );
        }
        
        return new ServerError(
          res, 
          500, 
          errorMessage
        );
      }
    } catch (error) {
      console.error('Error in metaads/pages:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
);

