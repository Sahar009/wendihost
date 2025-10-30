import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import generator from "generate-password";
import { hashPassword } from '@/services/functions';
import { teamMail } from '@/services/sendMail';



export default withIronSessionApiRoute(
  async function createContact(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const password =  generator.generate({
            length: 12,
            numbers: true,
            symbols: true,
            strict: true
        });

        const { workspaceId } = req.query

        const hash = await hashPassword(password)

        const { name, email, role  } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const { workspace } = validatedInfo 

        const member = await prisma.member.create({
            data: {
                name,
                email,
                role,
                password: hash,
                workspaceId: Number(workspaceId)
            },
        })

        await teamMail(name, email, password, workspace.name, workspace.workspaceId)
        
        return res.send({ 
            status: 'success', 
            statusCode: 201,
            message: "Contact added Successfully",
            data: member
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

