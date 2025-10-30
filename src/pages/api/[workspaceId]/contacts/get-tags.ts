
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { createSession, sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';
import { getContactTag } from '@/services/functions';



export default withIronSessionApiRoute(
  async function getTags(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const contactTags = await getContactTag(Number(workspaceId))
      
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { contactTags }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

