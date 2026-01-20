import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { FACEBOOK_BASE_ENDPOINT } from '@/libs/constants';

export default withIronSessionApiRoute(
  async function verifyFacebookPage(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, pageId } = req.query;

      if (!pageId || typeof pageId !== 'string') {
        return new ServerError(res, 400, 'Page ID is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { workspace } = validatedInfo;

      if (!workspace.accessToken) {
        return new ServerError(res, 400, 'Facebook account not connected');
      }

      // Verify page exists and get page info from Facebook Graph API
      try {
        const endpoint = `${FACEBOOK_BASE_ENDPOINT}${pageId}`;
        
        console.log('Verifying Facebook page:', {
          pageId,
          endpoint,
          hasAccessToken: !!workspace.accessToken
        });

        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${workspace.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,category,link'
          }
        });

        console.log('Facebook page verification response:', {
          hasData: !!response.data,
          pageName: response.data?.name,
          pageCategory: response.data?.category
        });

        const pageData = response.data;

        if (!pageData || !pageData.id) {
          return new ServerError(res, 404, 'Page not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Page verified successfully',
          data: {
            id: pageData.id,
            name: pageData.name,
            category: pageData.category,
            link: pageData.link
          }
        });
      } catch (error: any) {
        console.error('Error verifying Facebook page:', {
          error: error.response?.data || error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          endpoint: error.config?.url
        });
        
        const errorMessage = error.response?.data?.error?.message || 'Failed to verify Facebook page';
        const errorCode = error.response?.data?.error?.code;
        
        // Handle specific Facebook API errors
        if (errorCode === 100 || errorMessage.includes('does not exist') || errorMessage.includes('Invalid page ID')) {
          return new ServerError(res, 404, 'Page ID not found or invalid. Please check the page ID and try again.');
        }
        
        if (errorCode === 200 || errorMessage.includes('permission') || errorMessage.includes('scope')) {
          return new ServerError(
            res, 
            403, 
            'Access token does not have permission to verify this page. Please reconnect your Facebook account with pages_show_list permission.'
          );
        }
        
        return new ServerError(
          res, 
          500, 
          errorMessage || 'Failed to verify page ID'
        );
      }
    } catch (error) {
      console.error('Error in metaads/verify-page:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
);





