import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function deleteSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query

        const { id } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const { user } = validatedInfo 

        const member = await prisma.member.delete({
            where: {
                id
            },
        })
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Deleted Successfully",
            data: member, 
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

