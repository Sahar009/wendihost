import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
    async function listChatbots(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
        try {
            const { workspaceId } = req.query;
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId));
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");

            const chatbots = await prisma.chatbot.findMany({
                where: {
                    workspaceId: Number(workspaceId)
                },
                select: {
                    id: true,
                    name: true,
                    trigger: true,
                    default: true,
                    publish: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Chatbots retrieved successfully",
                data: chatbots
            });
            
        } catch (e) {
            return new ServerError(res, 400, "Bad Request");
        }
    },
    sessionCookie(),
);

