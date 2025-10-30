
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

        const { workspaceId, phone } = req.query

        const { chatId, status } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")


        const allCounts = await prisma.conversation.count({
            where: {
                workspaceId: Number(workspaceId),
            }, 
        })

        const mineCounts = await prisma.conversation.count({
            where: {
                workspaceId: Number(workspaceId),
                assigned: true
            }, 
        })

        const unassignedCounts = await prisma.conversation.count({
            where: {
                workspaceId: Number(workspaceId),
                assigned: false
            }, 
        })
  
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "fetch was successful",
            data: { allCounts, unassignedCounts, mineCounts }, 
        });
            
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

