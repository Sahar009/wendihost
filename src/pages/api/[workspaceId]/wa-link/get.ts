
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse, TEMPLATE_STATUS } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getTemplate } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query
        
        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const links = await prisma.whatsappLink.findMany({
            where: {
                workspaceId: Number(workspaceId)
            },
        })

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "fetch was successful",
            data: links, 
        });
        
    } catch (e) {
        return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);

