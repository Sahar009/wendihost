import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


export default withIronSessionApiRoute(
  async function deleteChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const workspaceId = req.query.workspaceId

      const id = req.query.id

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const chatbot = await prisma.chatbot.delete({
        where: {
          id: Number(id),
        }
      })

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Deleted successfully",
        data: chatbot
      });
      
    } catch (e) {
      return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

