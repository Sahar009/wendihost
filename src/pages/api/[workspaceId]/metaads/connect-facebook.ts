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
      console.log('🔄 Exchanging code for access token...');
      console.log('Code length:', code?.length);
      
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

      console.log('✅ Token response received:', {
        hasAccessToken: !!tokenResponse.data.access_token,
        hasExpiresIn: !!tokenResponse.data.expires_in,
        tokenType: tokenResponse.data.token_type
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        console.error('❌ No access token in response:', tokenResponse.data);
        return new ServerError(res, 400, 'Failed to get access token from Facebook');
      }

      console.log('✅ Access token obtained (length:', accessToken.length + ')');

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
        console.log('Token debug info:', JSON.stringify(tokenInfo, null, 2));
        
        if (tokenInfo.user_id) {
          fbUserId = parseInt(tokenInfo.user_id);
          console.log('✅ Facebook User ID for Meta Ads:', fbUserId);
        } else {
          console.warn('⚠️ No user_id in token debug response');
        }
        
        console.log('Token scopes:', tokenInfo.scopes);
        console.log('Token type:', tokenInfo.type);
      } catch (debugError: any) {
        console.error('❌ Error fetching Facebook User ID:', {
          message: debugError.response?.data?.error?.message || debugError.message,
          code: debugError.response?.data?.error?.code
        });
      }

      // Fetch Facebook pages
      try {
        const userId = fbUserId ? String(fbUserId) : 'me';
        console.log(`🔍 Fetching pages for userId: ${userId}`);
        
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
        console.log(`✅ Found ${pages.length} pages for Meta Ads`);
        if (pages.length > 0) {
          console.log('Pages:', pages.map((p: any) => ({ id: p.id, name: p.name })));
        }

        if (pages.length > 0) {
          // Use the first page ID
          facebookPageId = pages[0].id;
          console.log('✅ Facebook Page ID for Meta Ads:', facebookPageId);
        }

        // If no pages found with userId, try 'me' as fallback
        if (pages.length === 0 && userId !== 'me') {
          console.log('⚠️ No pages found with userId, trying "me" endpoint...');
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
            console.log(`✅ Found ${mePages.length} pages from "me" endpoint`);
            if (mePages.length > 0) {
              facebookPageId = mePages[0].id;
              console.log('✅ Facebook Page ID (from me endpoint):', facebookPageId);
            }
          } catch (meError: any) {
            console.warn('❌ Error fetching pages from "me" endpoint:', {
              message: meError.response?.data?.error?.message || meError.message,
              code: meError.response?.data?.error?.code,
              type: meError.response?.data?.error?.type
            });
          }
        }
      } catch (pagesError: any) {
        console.error('❌ Error fetching Facebook pages:', {
          message: pagesError.response?.data?.error?.message || pagesError.message,
          code: pagesError.response?.data?.error?.code,
          type: pagesError.response?.data?.error?.type,
          fullError: pagesError.response?.data
        });
        // Continue without facebookPageId - user can select manually
      }

      // Update workspace with Facebook Meta Ads connection
      // Note: We're storing this separately or updating the existing accessToken
      // For now, we'll update the workspace with Meta Ads specific fields
      console.log('💾 Saving to database:', {
        fbUserId,
        facebookPageId,
        hasAccessToken: !!accessToken
      });

      const updateData: any = {};
      
      // Only update if we have values (don't set to null/undefined)
      if (fbUserId) {
        updateData.fbUserId = fbUserId;
      }
      if (facebookPageId) {
        updateData.facebookPageId = facebookPageId;
      }
      
      // Save the access token for Meta Ads (it has the right permissions)
      // This will overwrite the existing accessToken, but that's okay since this one has Meta Ads permissions
      if (accessToken) {
        updateData.accessToken = accessToken;
      }

      console.log('📝 Update data:', updateData);

      const updatedWorkspace = await prisma.workspace.update({
        where: {
          id: Number(workspaceId)
        },
        data: updateData
      });

      console.log('✅ Workspace updated:', {
        id: updatedWorkspace.id,
        fbUserId: updatedWorkspace.fbUserId,
        facebookPageId: updatedWorkspace.facebookPageId,
        hasAccessToken: !!updatedWorkspace.accessToken
      });

      // Warn if critical data is missing
      if (!fbUserId || !facebookPageId) {
        console.warn('⚠️ Connection completed but missing data:', {
          hasFbUserId: !!fbUserId,
          hasFacebookPageId: !!facebookPageId
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: fbUserId && facebookPageId 
          ? 'Facebook connected successfully for Meta Ads'
          : 'Facebook connected, but some data may be missing. Please check server logs.',
        data: {
          workspace: updatedWorkspace,
          pagesCount: facebookPageId ? 1 : 0,
          fbUserId,
          facebookPageId
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

