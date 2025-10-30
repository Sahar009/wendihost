
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { sendImageMsg, sendTextMsg } from '@/services/waba/send-msg';



export default withIronSessionApiRoute(
  async function sendMessageFile(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {
      const { workspaceId, phone } = req.query
      const { message, link, chatId } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

      const url = "https://wendi.app" + link

      const valid_phone = phone?.slice(1, phone.length)
      const sendMessage = await sendImageMsg(workspace, String(valid_phone), url, message)
 
      if (!sendMessage) return new ServerError(res, 400, "Error sending message")

      const messageRes = await prisma.message.create({
        data: {
          status: "sent", 
          message: message,
          link: link,
          fileType: "image",
          conversationId: chatId,
          workspaceId: Number(workspaceId),
          phone: String(phone),
          createdAt: new Date(),
          messageId: sendMessage.id
        }
      })
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: messageRes, 
      });   
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }
  },
  sessionCookie(),
);

