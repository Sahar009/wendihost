
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { createSession, sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const snippet = await prisma.snippet.findMany({
            where: {
                workspaceId: Number(workspaceId)
            },
        })
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "fetch was successful",
            data: snippet, 
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Email already exists please login")
    }

  },
  sessionCookie(),
);

