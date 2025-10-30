
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';


export default withIronSessionApiRoute(
  async function getChatAll(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, page, filterBy, sortedBy, view } = req.query

      const { skip, take } = getPage(Number(page))

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
      
      let query = {}

      switch(filterBy) {
        case "assigned":
          query = { assigned: true }
          break
        case "unassigned":
          query = { assigned: false }
          break
      }

      const chats = await prisma.conversation.findMany({
        where: {
          workspaceId: Number(workspaceId),
          status: "open",
          ...query
        },
        include: {
          contact: true
        },
        skip, take,
        orderBy: {
          updatedAt: sortedBy === "oldest" ? "asc" : "desc" 
        }
      })

      const counts = await prisma.conversation.count({
        where: {
          workspaceId: Number(workspaceId)
        }
      })
        
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { chats, counts }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

