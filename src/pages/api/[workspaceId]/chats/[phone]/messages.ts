
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

      const { workspaceId, phone, start } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
      
      const messages = await prisma.message.findMany({
        where: {
          workspaceId: Number(workspaceId),
          phone: String(phone)
        },
        skip: Number(start), take: 100,
        orderBy: {  createdAt: "desc" }
      })

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: messages?.reverse(), 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

