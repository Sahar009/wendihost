import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


export default withIronSessionApiRoute(
  async function updateRole(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {


        const { workspaceId } = req.query

        const { id, role } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const member = await prisma.member.update({
            where: {
                id: id,
                //workspaceId: Number(workspaceId)
            },
            data: {
                role: role,
            },
        })

        console.log(member)

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: `Role updated successfully`,
            data: member
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

