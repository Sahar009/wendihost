
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

      const phoneInfos = await getWhatsappPhone(access_token, wabaId)

      if (!phoneInfos) return new ServerError(res,  400, "Phone Number Verification Failed!")

      const subscription = await subscribe(access_token, wabaId)

      if (!subscription) return new ServerError(res,  400, "Subscription Failed!")

      const registration = await registerPhoneNumber(access_token, phoneNumberId)

      if (!registration) return new ServerError(res,  400, "Registration Failed!")

      const displayPhoneNumber = phoneInfos?.filter((phoneInfo: any) => phoneInfo.id == phoneNumberId)[0].display_phone_number

      await prisma.workspace.update({
        where: {
          id: Number(workspaceId) 
        }, 
        data: {
          whatsappId: wabaId,
          businessId: wabaId,
          accessToken: access_token,
          phone: displayPhoneNumber,
          phoneId: phoneNumberId
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
            
    } catch (e) {
      console.log(e)
      return new ServerError(res,  500, "Internal server error")
    }
  },
  sessionCookie(),
);

