import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import generator from "generate-password";
import { hashPassword } from '@/services/functions';
import { teamResetMail } from '@/services/sendMail';



export default withIronSessionApiRoute(
  async function resetPassword(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const password =  generator.generate({
            length: 12,
            numbers: true,
            symbols: true,
            strict: true
        });

        const { workspaceId } = req.query

        const hash = await hashPassword(password)

        const { id } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const { workspace } = validatedInfo

        const member = await prisma.member.update({
            where: {
                id: id,
                //workspaceId: Number(workspaceId)
            },
            data: {
                password: hash,
            },
        })

        console.log(member)

        const { name, email } = member

        await teamResetMail(name, email, password, workspace.name, workspace.workspaceId)
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: `Password reset email has been sent to ${email}`,
            data: member
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

