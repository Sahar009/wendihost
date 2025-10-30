
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


export default withIronSessionApiRoute(
  async function createWaLink(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const { name, message, phoneNumber } = req.body

        await prisma.whatsappLink.create({
            data: {
                name,
                message,
                phoneNumber,
                workspaceId: Number(workspaceId),
            }
        })

        return res.send({ 
            status: 'success', 
            statusCode: 201,
            message: "Link generated Successfully",
            data: "", 
        });
        
    } catch (e) {
        console.error(e)
        return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);

