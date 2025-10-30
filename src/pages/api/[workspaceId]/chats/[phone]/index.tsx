
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { createSession, sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';
import { Conversation } from '@prisma/client';



export default withIronSessionApiRoute(
  async function getPhone(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, phone } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
      
      let chat = await prisma.conversation.findFirst({
        where: {
          workspaceId: Number(workspaceId),
          phone: String(phone)
        },
      })

      if (!chat)  {
        chat = await prisma.conversation.create({
          data: {
            workspaceId: Number(workspaceId),
            phone: String(phone)
          }
        })
      }
        
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: chat, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

