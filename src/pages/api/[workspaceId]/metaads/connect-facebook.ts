import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { FACEBOOK_APP_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_BASE_ENDPOINT } from '@/libs/constants';

export default withIronSessionApiRoute(
  async function connectFacebookForMetaAds(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { code } = req.body;

      if (!code) {
        return new ServerError(res, 400, 'Authorization code is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { workspace } = validatedInfo;

      // Exchange code for access token
      // For client-side OAuth, the redirect_uri should match what was used in FB.login
      // Since we're using config_id, we don't need redirect_uri
      const tokenResponse = await axios.post(
        `${FACEBOOK_BASE_ENDPOINT}oauth/access_token`,
        {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        return new ServerError(res, 400, 'Failed to get access token from Facebook');
      }

      // Get Facebook user ID and token info
      let fbUserId: number | null = null;
      let facebookPageId: string | null = null;
      let tokenInfo = null;

      try {
        const debugRes = await axios.get(`${FACEBOOK_BASE_ENDPOINT}debug_token`, {
          params: {
            input_token: accessToken,
            access_token: accessToken
          }
        });
        tokenInfo = debugRes.data.data;
        fbUserId = parseInt(tokenInfo.user_id);
        console.log('Facebook User ID for Meta Ads:', fbUserId);
        console.log('Token scopes:', tokenInfo.scopes);
      } catch (debugError) {
        console.error('Error fetching Facebook User ID:', debugError);
      }

      // Fetch Facebook pages
      try {
        const userId = fbUserId ? String(fbUserId) : 'me';
        const pagesResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}${userId}/accounts`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,category,access_token',
            limit: 100
          }
        });

        const pages = pagesResponse.data.data || [];
        console.log(`Found ${pages.length} pages for Meta Ads`);

        if (pages.length > 0) {
          // Use the first page ID
          facebookPageId = pages[0].id;
          console.log('Facebook Page ID for Meta Ads:', facebookPageId);
        }

        // If no pages found with userId, try 'me' as fallback
        if (pages.length === 0 && userId !== 'me') {
          try {
            const meResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}me/accounts`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              params: {
                fields: 'id,name,category,access_token',
                limit: 100
              }
            });
            const mePages = meResponse.data.data || [];
            if (mePages.length > 0) {
              facebookPageId = mePages[0].id;
              console.log('Facebook Page ID (from me endpoint):', facebookPageId);
            }
          } catch (meError: any) {
            console.warn('Error fetching pages from "me" endpoint:', meError.response?.data?.error?.message);
          }
        }
      } catch (pagesError: any) {
        console.warn('Error fetching Facebook pages:', {
          message: pagesError.response?.data?.error?.message || pagesError.message,
          code: pagesError.response?.data?.error?.code
        });
        // Continue without facebookPageId - user can select manually
      }

      // Update workspace with Facebook Meta Ads connection
      // Note: We're storing this separately or updating the existing accessToken
      // For now, we'll update the workspace with Meta Ads specific fields
      const updatedWorkspace = await prisma.workspace.update({
        where: {
          id: Number(workspaceId)
        },
        data: {
          fbUserId: fbUserId || undefined,
          facebookPageId: facebookPageId || undefined,
          // Optionally store a separate Meta Ads access token
          // For now, we'll use the same accessToken if it has the right permissions
          // Or you could add a new field like metaAdsAccessToken
        }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Facebook connected successfully for Meta Ads',
        data: {
          workspace: updatedWorkspace,
          pagesCount: facebookPageId ? 1 : 0
        }
      });

    } catch (error: any) {
      console.error('Error connecting Facebook for Meta Ads:', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to connect Facebook';
      return new ServerError(res, error.response?.status || 500, errorMessage);
    }
  },
  sessionCookie()
);

