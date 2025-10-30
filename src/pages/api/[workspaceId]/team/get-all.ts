
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';



export default withIronSessionApiRoute(
  async function getAll(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { user } = validatedInfo 

      const members = await prisma.member.findMany({
        where: {
          workspaceId: Number(workspaceId)
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
      })

      const counts = await prisma.member.count({
        where: {
          workspaceId: Number(workspaceId)
        }
      })
      
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { members, counts }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

