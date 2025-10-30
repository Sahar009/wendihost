
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function getStatus(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

        const { workspaceId } = req.query

        const { chatId, assign, memberId } = req.body
 
        const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const updatedConversation = await prisma.conversation.update({
            where: {
                id: chatId
            }, 
            data: {
                assigned: Boolean(assign),
                memberId: assign ? Number(memberId) : null
            }
        })

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: `Chat ${assign ? 'assigned' : 'unassigned' } successfully`,
            data: updatedConversation, 
        });
            
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

