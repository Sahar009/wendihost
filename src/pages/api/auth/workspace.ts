
import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, sessionCookie } from '@/services/session';
import { comparePassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


  
export default withIronSessionApiRoute(
  async function workspaceRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { email, password, workspaceId } = req.body

        const workspace = await prisma.workspace.findFirst({
            where: {
                workspaceId: workspaceId
            },
        })

        if (!workspace) return new ServerError(res, 404, "Workspace not Found")

        const member = await prisma.member.findFirst({
            where: {
                email: email.toLowerCase(),
                workspaceId: workspace?.id
            },
        })

        if (!member) throw new Error()

        if(await comparePassword(password, member?.password)) {
            
            member.password = ""

            await createSession(member, req, false)
    
            return res.send({ status: 'success', statusCode: 200, message: 'Authentication successful redirecting...', data: member });
    
        };
        
        return new ServerError(res, 400, "Email or Password is incorrect")

    } catch (e) {
        return new ServerError(res, 400, "Email or Password is incorrect")
    }


  },
  sessionCookie(),
);

