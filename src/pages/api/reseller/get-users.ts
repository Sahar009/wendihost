import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApiNoWorkspace } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function getUsers(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const user = await validateUserApiNoWorkspace(req)

            const data = user as User | null

            if (!data) return new ServerError(res, 401, "Unauthorized")

            const users = await prisma.user.findMany({
                where: {
                    resellerId: Number(data?.id)
                }
            })

            const counts = await prisma.user.count({
                where: {
                    resellerId: Number(data?.id)
                }
            })
            

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Fetched successfully",
                data: { users, counts }
            });
            
        } catch (e) {
            return new ServerError(res,  400, "Bad Request")
        }

    },
    sessionCookie(),
);

