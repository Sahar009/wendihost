
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { FACEBOOK_APP_ID, FACEBOOK_CLIENT_SECRET } from '@/libs/constants';
import { getWhatsappPhone, registerPhoneNumber, subscribe } from '@/services/waba/accounts';


export default withIronSessionApiRoute(
  async function fetchFbId(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {
      
      const { workspaceId } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { code, phoneNumberId, wabaId } = req.body

      const url = "https://graph.facebook.com/v21.0/oauth/access_token";
      
      console.log('Exchanging code for access token', {
        hasAppId: !!FACEBOOK_APP_ID,
        appId: FACEBOOK_APP_ID,
        secretLength: FACEBOOK_CLIENT_SECRET?.length,
        hasCode: !!code,
        codeLength: code?.length,
      });

      const response = await axios.post(url, 
        JSON.stringify({
          "client_id": FACEBOOK_APP_ID,
          "client_secret": FACEBOOK_CLIENT_SECRET,
          "code": code,
          "grant_type": "authorization_code"
        }),
        {  headers: { "Content-Type": "application/json" } }, 
      );

      const access_token = response.data.access_token

      // Get Facebook user ID from debug_token for Meta Ads
      let fbUserId: number | null = null
      let facebookPageId: string | null = null
      
      try {
        const debugRes = await axios.get(`https://graph.facebook.com/v21.0/debug_token?input_token=${access_token}&access_token=${access_token}`)
        fbUserId = parseInt(debugRes.data.data?.user_id)
        console.log('Facebook User ID:', fbUserId)
      } catch (debugError) {
        console.error('Error fetching Facebook User ID:', debugError)
        // Continue without fbUserId - it's only needed for Meta Ads
      }

      // Fetch Facebook pages to get page ID for Meta Ads
      // Note: WhatsApp Business tokens may not have pages_show_list permission
      // Pages will be fetched on-demand via the /api/[workspaceId]/metaads/pages endpoint
      try {
        // First, check token permissions
        let tokenInfo = null;
        try {
          const debugTokenRes = await axios.get(`https://graph.facebook.com/v21.0/debug_token`, {
            params: {
              input_token: access_token,
              access_token: access_token
            }
          });
          tokenInfo = debugTokenRes.data.data;
          console.log('Token info for pages:', {
            scopes: tokenInfo.scopes,
            type: tokenInfo.type,
            hasPagesPermission: tokenInfo.scopes?.includes('pages_show_list')
          });
        } catch (debugError) {
          console.warn('Could not debug token for pages:', debugError);
        }

        // Only try to fetch pages if token has the right permissions
        if (tokenInfo?.scopes?.includes('pages_show_list') || tokenInfo?.type !== 'SYSTEM_USER') {
          const userId = fbUserId ? String(fbUserId) : 'me'
          
          try {
            const pagesResponse = await axios.get(`https://graph.facebook.com/v21.0/${userId}/accounts`, {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
              },
              params: {
                fields: 'id,name,category',
                limit: 100
              }
            })

            const pages = pagesResponse.data.data || []
            console.log(`Found ${pages.length} pages for userId: ${userId}`)
            
            // If no pages found with userId, try 'me' as fallback
            if (pages.length === 0 && userId !== 'me') {
              try {
                const meResponse = await axios.get(`https://graph.facebook.com/v21.0/me/accounts`, {
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                  },
                  params: {
                    fields: 'id,name,category',
                    limit: 100
                  }
                })
                const mePages = meResponse.data.data || []
                console.log(`Found ${mePages.length} pages from "me" endpoint`)
                if (mePages.length > 0) {
                  // Use the first page ID
                  facebookPageId = mePages[0].id
                  console.log('Facebook Page ID (from me endpoint):', facebookPageId)
                }
              } catch (meError: any) {
                console.warn('Error fetching pages from "me" endpoint:', {
                  message: meError.response?.data?.error?.message || meError.message,
                  code: meError.response?.data?.error?.code
                })
              }
            } else if (pages.length > 0) {
              // Use the first page ID
              facebookPageId = pages[0].id
              console.log('Facebook Page ID:', facebookPageId)
            }
          } catch (pagesError: any) {
            console.warn('Error fetching Facebook pages:', {
              message: pagesError.response?.data?.error?.message || pagesError.message,
              code: pagesError.response?.data?.error?.code,
              type: pagesError.response?.data?.error?.type
            })
            // Continue without facebookPageId - pages can be fetched later via the pages API
          }
        } else {
          console.log('Token does not have pages_show_list permission. Pages will be fetched on-demand via the pages API.')
        }
      } catch (pagesError: any) {
        console.warn('Error in pages fetching logic (non-critical):', {
          message: pagesError.response?.data?.error?.message || pagesError.message
        })
        // Continue without facebookPageId - it's not critical for WhatsApp connection
      }

      const phoneInfos = await getWhatsappPhone(access_token, wabaId)

      if (!phoneInfos) return new ServerError(res,  400, "Phone Number Verification Failed!")

      const subscription = await subscribe(access_token, wabaId)

      if (!subscription) return new ServerError(res,  400, "Subscription Failed!")

      const registration = await registerPhoneNumber(access_token, phoneNumberId)

      if (!registration) return new ServerError(res,  400, "Registration Failed!")

      const displayPhoneNumber = phoneInfos?.filter((phoneInfo: any) => phoneInfo.id == phoneNumberId)[0].display_phone_number

      const existingWorkspace = await prisma.workspace.findFirst({
        where: {
          phone: displayPhoneNumber,
          NOT: {
            id: Number(workspaceId)
          }
        },
        select: {
          id: true,
          name: true
        }
      })

      if (existingWorkspace) {
        return new ServerError(
          res,
          400,
          `This phone number is already connected to workspace "${existingWorkspace.name}". Please disconnect it there first.`
        )
      }

      const existingPhoneId = await prisma.workspace.findFirst({
        where: {
          phoneId: phoneNumberId,
          NOT: {
            id: Number(workspaceId)
          }
        },
        select: {
          id: true,
          name: true
        }
      })

      if (existingPhoneId) {
        return new ServerError(
          res,
          400,
          `This WhatsApp phone ID is already in use by workspace "${existingPhoneId.name}".`
        )
      }

      await prisma.workspace.update({
        where: {
          id: Number(workspaceId) 
        }, 
        data: {
          whatsappId: wabaId,
          businessId: wabaId,
          accessToken: access_token,
          phone: displayPhoneNumber,
          phoneId: phoneNumberId,
          fbUserId: fbUserId || undefined,
          facebookPageId: facebookPageId || undefined
        }
      })

      const workspace = await prisma.workspace.findUnique({ where: { id: Number(workspaceId) } })

      return res.send({ 
        status: 'success',
        statusCode: 200,
        message: "WhatsApp Business account connected successfully",
        data: {
          phone: displayPhoneNumber,
          workspace: workspace
        }
      });
            
    } catch (e: any) {
      const errorDetails = e?.response?.data || e?.message || e;
      console.error('WABA access-token error:', errorDetails);
      const message =
        typeof errorDetails === 'string'
          ? errorDetails
          : errorDetails?.error?.message || 'Internal server error';
      return new ServerError(res,  500, message)
    }
  },
  sessionCookie(),
);

