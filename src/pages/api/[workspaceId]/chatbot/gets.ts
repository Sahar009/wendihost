import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
    async function getChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId } = req.query

            const validatedInfo = await validateUserApi(req, Number(workspaceId))

            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
      
            const chatbot = await prisma.chatbot.findMany({
                where: {
                    workspaceId: Number(workspaceId)
                }
            })

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Fetched successfully",
                data: chatbot
            });
            
        } catch (e) {
            return new ServerError(res,  400, "Bad Request")
        }

    },
    sessionCookie(),
);

