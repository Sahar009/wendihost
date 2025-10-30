
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function readChat(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId } = req.query

            const { chatId } = req.body
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

            await prisma.conversation.update({
                where: {  id: chatId  }, 
                data: { read: true  }
            })

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "fetch was successful",
                data: null, 
            });
            
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

