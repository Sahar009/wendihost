
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function getBroadcast(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const { tag, toAll } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      let contacts = []

      if (toAll) {
        contacts = await prisma.contact.findMany({
          where: {
            workspaceId: Number(workspaceId)
          }
        })
        length = 0
      } else {
        contacts = await prisma.contact.findMany({
          where: {
            workspaceId: Number(workspaceId),
            tag: tag
          }
        })
      }

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Fetched Successfully",
        data: contacts.length, 
      });
        
    } catch (e) {
      console.log(e)
      return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);