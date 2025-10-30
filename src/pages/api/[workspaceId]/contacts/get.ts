
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { createSession, sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';
import { getContactTag } from '@/services/functions';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, page } = req.query

      const { skip, take } = getPage(Number(page))

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const contacts = await prisma.contact.findMany({
        where: {
          workspaceId: Number(workspaceId)
        },
        skip, take,
      })

      const counts = await prisma.contact.count({
        where: {
          workspaceId: Number(workspaceId)
        }
      })

      const tags = await getContactTag(Number(workspaceId))

      
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { contacts, counts, tags }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

