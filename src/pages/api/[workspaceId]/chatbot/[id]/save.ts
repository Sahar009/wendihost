import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


export default withIronSessionApiRoute(
  async function newChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const workspaceId = req.query.workspaceId
      const id = req.query.id

      const { nodes, edges, bot, publish } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const updateData: any = {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        bot: JSON.stringify(bot)
      }

      // Only update publish status if it's provided
      if (publish !== undefined) {
        updateData.publish = Boolean(publish)
      }

      const chatbot = await prisma.chatbot.updateMany({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId)
        },
        data: updateData
      })

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Save successfully",
        data: chatbot
      });
      
    } catch (e) {
      return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

