
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
      try {
        const debugRes = await axios.get(`https://graph.facebook.com/v21.0/debug_token?input_token=${access_token}&access_token=${access_token}`)
        fbUserId = parseInt(debugRes.data.data?.user_id)
        console.log('Facebook User ID:', fbUserId)
      } catch (debugError) {
        console.error('Error fetching Facebook User ID:', debugError)
        // Continue without fbUserId - it's only needed for Meta Ads
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
          fbUserId: fbUserId || undefined
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

