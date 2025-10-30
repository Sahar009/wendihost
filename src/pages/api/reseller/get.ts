import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApiNoWorkspace } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function getDomain(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { name  } = req.body

            const user = await validateUserApiNoWorkspace(req)

            const data = user as User | null

            if (!data) return new ServerError(res, 401, "Unauthorized")

            const reseller = await prisma.reseller.findUnique({
                where: {    userId: data?.id    }
            })

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Fetched successfully",
                data: reseller
            });
            
        } catch (e) {
            return new ServerError(res,  400, "Bad Request")
        }

    },
    sessionCookie(),
);

