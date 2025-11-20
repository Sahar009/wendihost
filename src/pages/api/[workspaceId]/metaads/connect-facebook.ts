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
      // Using BigInt for Facebook User IDs as they can be 64-bit integers
      let fbUserId: bigint | null = null;
      let facebookPageId: string | null = null;
      let tokenInfo = null;

      // Try to get user ID from /me endpoint first (simpler and more reliable)
      try {
        console.log('🔍 Fetching user info from /me endpoint...');
        const meResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id'
          }
        });
        
        if (meResponse.data.id) {
          // Convert to BigInt to handle large Facebook User IDs
          fbUserId = BigInt(meResponse.data.id);
          console.log('✅ Facebook User ID from /me endpoint:', fbUserId.toString());
        }
      } catch (meError: any) {
        console.warn('⚠️ Could not get user ID from /me endpoint:', {
          message: meError.response?.data?.error?.message || meError.message,
          code: meError.response?.data?.error?.code
        });
      }

      // Also try debug_token with app access token (more reliable)
      if (!fbUserId) {
        try {
          console.log('🔍 Trying debug_token with app access token...');
          // App access token format: app_id|app_secret
          const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_CLIENT_SECRET}`;
          
          const debugRes = await axios.get(`${FACEBOOK_BASE_ENDPOINT}debug_token`, {
            params: {
              input_token: accessToken,
              access_token: appAccessToken
            }
          });
          tokenInfo = debugRes.data.data;
          console.log('Token debug info:', JSON.stringify(tokenInfo, null, 2));
          
          if (tokenInfo.user_id) {
            // Convert to BigInt to handle large Facebook User IDs
            fbUserId = BigInt(tokenInfo.user_id);
            console.log('✅ Facebook User ID from debug_token:', fbUserId.toString());
          } else {
            console.warn('⚠️ No user_id in token debug response');
          }
          
          console.log('Token scopes:', tokenInfo.scopes);
          console.log('Token type:', tokenInfo.type);
        } catch (debugError: any) {
          console.error('❌ Error fetching Facebook User ID from debug_token:', {
            message: debugError.response?.data?.error?.message || debugError.message,
            code: debugError.response?.data?.error?.code
          });
        }
      }

      // Fetch Facebook pages
      // Try /me/accounts first (most reliable)
      try {
        console.log('🔍 Fetching pages from /me/accounts endpoint...');
        const mePagesResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}me/accounts`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            fields: 'id,name,category,access_token',
            limit: 100
          }
        });

        const mePages = mePagesResponse.data.data || [];
        console.log(`✅ Found ${mePages.length} pages from /me/accounts`);
        if (mePages.length > 0) {
          console.log('Pages:', mePages.map((p: any) => ({ id: p.id, name: p.name })));
          facebookPageId = mePages[0].id;
          console.log('✅ Facebook Page ID for Meta Ads:', facebookPageId);
        }
      } catch (mePagesError: any) {
        const errorMessage = mePagesError.response?.data?.error?.message || mePagesError.message;
        const errorCode = mePagesError.response?.data?.error?.code;
        const errorType = mePagesError.response?.data?.error?.type;
        
        console.warn('⚠️ Error fetching pages from /me/accounts:', {
          message: errorMessage,
          code: errorCode,
          type: errorType
        });
        
        // Check if it's a permission error
        const isPermissionError = 
          errorMessage?.toLowerCase().includes('permission') ||
          errorMessage?.toLowerCase().includes('pages_show_list') ||
          errorCode === 200 || // Facebook uses 200 for permission errors sometimes
          errorType === 'OAuthException';
        
        if (isPermissionError) {
          console.error('🚨 PERMISSION ERROR DETECTED:', {
            message: errorMessage,
            solution: 'User needs to grant pages_show_list permission in Facebook App settings'
          });
        }
        
        // Fallback: try with userId if we have it
        if (fbUserId && !facebookPageId) {
          try {
            const userIdStr = String(fbUserId);
            console.log(`🔍 Trying pages with userId: ${userIdStr}...`);
            const userIdPagesResponse = await axios.get(`${FACEBOOK_BASE_ENDPOINT}${userIdStr}/accounts`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              params: {
                fields: 'id,name,category,access_token',
                limit: 100
              }
            });

            const userIdPages = userIdPagesResponse.data.data || [];
            console.log(`✅ Found ${userIdPages.length} pages from userId endpoint`);
            if (userIdPages.length > 0) {
              facebookPageId = userIdPages[0].id;
              console.log('✅ Facebook Page ID (from userId endpoint):', facebookPageId);
            }
          } catch (userIdPagesError: any) {
            const userIdErrorMsg = userIdPagesError.response?.data?.error?.message || userIdPagesError.message;
            console.error('❌ Error fetching pages from userId endpoint:', {
              message: userIdErrorMsg,
              code: userIdPagesError.response?.data?.error?.code,
              type: userIdPagesError.response?.data?.error?.type
            });
            
            // Check if this is also a permission error
            if (userIdErrorMsg?.toLowerCase().includes('permission') || 
                userIdErrorMsg?.toLowerCase().includes('pages_show_list')) {
              console.error('🚨 PERMISSION ERROR: pages_show_list permission is required');
            }
          }
        }
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
        fbUserId: updatedWorkspace.fbUserId ? String(updatedWorkspace.fbUserId) : null,
        facebookPageId: updatedWorkspace.facebookPageId,
        hasAccessToken: !!updatedWorkspace.accessToken
      });

      // Warn if critical data is missing
      const hasPermissionIssue = !facebookPageId && fbUserId; // Has user ID but no pages = likely permission issue
      
      if (!fbUserId || !facebookPageId) {
        console.warn('⚠️ Connection completed but missing data:', {
          hasFbUserId: !!fbUserId,
          hasFacebookPageId: !!facebookPageId,
          likelyPermissionIssue: hasPermissionIssue
        });
      }

      let message = 'Facebook connected successfully for Meta Ads';
      let warningMessage = null;
      
      if (!fbUserId && !facebookPageId) {
        message = 'Facebook connection attempted, but could not retrieve user or page data. Please try again.';
      } else if (!facebookPageId) {
        if (hasPermissionIssue) {
          message = 'Facebook connected, but page access requires additional permissions';
          warningMessage = 'PERMISSION_REQUIRED';
        } else {
          message = 'Facebook connected, but no pages found. You can select a page manually when creating ads.';
        }
      } else if (!fbUserId) {
        message = 'Facebook connected, but user ID could not be retrieved. Page connection successful.';
      }

      // Recursive function to convert all BigInt values to strings
      const convertBigIntToString = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }
        if (typeof obj === 'bigint') {
          return obj.toString();
        }
        if (Array.isArray(obj)) {
          return obj.map(convertBigIntToString);
        }
        if (typeof obj === 'object') {
          const converted: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              converted[key] = convertBigIntToString(obj[key]);
            }
          }
          return converted;
        }
        return obj;
      };

      // Convert BigInt to string for JSON serialization
      const responseData: ApiResponse = {
        status: 'success',
        statusCode: 200,
        message,
        data: {
          workspace: convertBigIntToString(updatedWorkspace),
          pagesCount: facebookPageId ? 1 : 0,
          fbUserId: fbUserId ? String(fbUserId) : null,
          facebookPageId,
          hasPermissionIssue
        }
      };

      return res.status(200).json(responseData);

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

