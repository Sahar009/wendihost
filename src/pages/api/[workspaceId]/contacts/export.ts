
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const { user } = validatedInfo 

        const contacts = await prisma.contact.findMany({
            where: {
                workspaceId: Number(workspaceId)
            },
            select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
            }
        })

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "fetch was successful",
            data: contacts, 
        });
        
    } catch (e) {
        return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

