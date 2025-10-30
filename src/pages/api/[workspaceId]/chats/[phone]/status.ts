
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';



export default withIronSessionApiRoute(
  async function setChatStatus(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, phone } = req.query

      const { chatId, status } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { user } = validatedInfo 

      const conversation = await prisma.conversation.update({
        where: {
          //workspaceId: Number(workspaceId),
          id: chatId
        }, 
        data: {
          status: status == "closed" ? "open" : "closed", 
          updatedAt: new Date()
        }
      })

      const message = await prisma.message.create({
        data: {
          conversationId: Number(chatId),
          message: `${status == "closed" ? "Open" : "Closed"} conversation`, 
          senderMemberId: user?.role ? user?.id : undefined,
          senderUserId: user?.role ? undefined : user.id,
          phone: String(phone),
          workspaceId: Number(workspaceId),
          type: "action"
        }
      })
        
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { message, conversation }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

