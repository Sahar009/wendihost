
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function getInfo(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId, phone } = req.query
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
    
            const contact = await prisma.contact.findFirst({
                where: {
                    workspaceId: Number(workspaceId),
                    phone: String(phone)
                }, 
            })
                
            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "fetch was successful",
                data: contact, 
            });
            
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

