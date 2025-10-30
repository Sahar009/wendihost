
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';
import { IConversationCounts } from '@/libs/interfaces';


export default withIronSessionApiRoute(
    async function getCounts(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId } = req.query
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
    
            const open = await prisma.conversation.count({
                where: {
                    workspaceId: Number(workspaceId),
                    status: "open",
                }
            })

            const assigned = await prisma.conversation.count({
                where: {
                    workspaceId: Number(workspaceId),
                    status: "open",
                    assigned: true
                }
            })

            const unassigned = await prisma.conversation.count({
                where: {
                    workspaceId: Number(workspaceId),
                    status: "open",
                    assigned: false
                }
            })
                
            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "fetch was successful",
                data: { open, assigned, unassigned } as IConversationCounts, 
            });
                
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

