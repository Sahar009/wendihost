
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function createContact(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { workspaceId } = req.query

        const { firstName, lastName, phone, email, tag  } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const contact = await prisma.contact.create({
            data: {
                firstName,
                lastName,
                phone,
                email,
                tag,
                workspaceId: Number(workspaceId)
            },
        })
        
        return res.send({ 
            status: 'success', 
            statusCode: 201,
            message: "Contact added Successfully",
            data: contact, 
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

