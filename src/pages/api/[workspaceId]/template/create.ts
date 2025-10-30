
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { WHATSAPP_BUSINESS_ACCOUNT_ID } from '@/libs/constants';
import { submitTemplate } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
  async function createTemplate(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const { name, category, language, components } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 
      
      
      const [sumbit, error] = await submitTemplate(
        workspace,
        { name, category, language, components: components }
      )

      if (!sumbit) {
        if (error?.message?.includes('Meta Business setup')) {
          return new ServerError(res, 400, error.message)
        }
        return new ServerError(res, 400, error?.error?.error_user_msg || error?.error?.error_user_title || "Error submitting template")
      }
          
      return res.send({ 
        status: 'success', 
        statusCode: 201,
        message: "Template Submitted Successfully",
        data: "", 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);

