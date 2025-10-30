
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { WHATSAPP_BUSINESS_ACCOUNT_ID } from '@/libs/constants';
import { createAuthTemplate, sendTemplateOTP, submitTemplate } from '@/services/waba/msg-templates';
import { generateApiKey } from '@/services/functions';
import send from '../broadcast/send';



export default withIronSessionApiRoute(
  async function createApiKey(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

      if (!workspace.apiKey) {
        await createAuthTemplate(workspace)
      }

      const newApiKey = await generateApiKey()

      await prisma.workspace.update({
        where: {
          id: workspace.id
        },
        data: {
          apiKey: newApiKey
        }
      })

      return res.send({ 
        status: 'success', 
        statusCode: 201,
        message: "API Key Created Successfully",
        data: { apiKey: newApiKey }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);

