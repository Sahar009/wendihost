
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { sendTextMsg } from '@/services/waba/send-msg';



export default withIronSessionApiRoute(
  async function sendMessage(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {
      const { workspaceId, phone } = req.query
      const { message, chatId } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

      const valid_phone = phone?.slice(1, phone.length)
      const sendMessage = await sendTextMsg(workspace, String(valid_phone), message)
      
      if (!sendMessage || sendMessage.error) {
        // Handle WhatsApp-specific errors
        if (sendMessage?.code === 131047) {
          return new ServerError(res, 400, "Re-engagement message: The user needs to send you a message first to start the conversation.")
        } else if (sendMessage?.code === 131026) {
          return new ServerError(res, 400, "Message undeliverable: The phone number may be invalid or blocked.")
        } else if (sendMessage?.code === 131021) {
          return new ServerError(res, 400, "Recipient cannot be messaged: The user may have blocked your business.")
        } else if (sendMessage?.code === 131037) {
          return new ServerError(res, 400, "Display name approval required: Your WhatsApp Business display name needs approval. Go to Facebook Business Manager to complete your business profile and submit for verification.")
        } else if (sendMessage?.message) {
          return new ServerError(res, 400, `WhatsApp Error: ${sendMessage.message}`)
        } else {
          return new ServerError(res, 400, "Unable to send message. Please check the phone number and try again.")
        }
      }

      const messageRes = await prisma.message.create({
        data: {
          status: "sent", 
          message: message,
          conversationId: chatId,
          workspaceId: Number(workspaceId),
          phone: String(phone),
          fileType: "none",
          createdAt: new Date(),
          messageId: sendMessage.id
        }
      })

      console.log({sendMessage})

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Message sent successfully",
        data: messageRes, 
      });   
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }
  },
  sessionCookie(),
);

