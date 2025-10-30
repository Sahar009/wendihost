
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import generateUniqueId from "generate-unique-id";
import { createSession, getResellerInfo, sessionCookie } from '@/services/session';
import { generateWorkspaceID, hashPassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import { authMail } from '@/services/sendMail';
import ServerError from '@/services/errors/serverError';
import { DOMAIN } from '@/libs/constants';


const DAY = 24 * 3600

const id = generateUniqueId({
    length: 32,
    useLetters: false
});


export default withIronSessionApiRoute(
  async function createRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { email, password, firstName, lastName } = req.body

        const hash = await hashPassword(password)

        const token = await hashPassword(email + id)

        const reseller = JSON.parse(await getResellerInfo(req))

        const workspaceId = await generateWorkspaceID()
    
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hash,
                resellerId: reseller?.userId,
                firstName,
                lastName,
                emailToken: token,
                resetToken: token,
                tokenExpireAt: new Date(Number(Date.now()) + DAY),
            },
        })

        const workspace = await prisma.workspace.create({
            data: {
                ownerId: user.id,
                name: "Default Workspace",
                description: "Welcome this is your first workspace",
                workspaceId: workspaceId
            },
        })

        const link = `${DOMAIN}/auth/verify/${token}`

        await createSession(user, req)

        await authMail(email, firstName, link)
        
        return res.send({ 
            status: 'success', 
            statusCode: 201,
            message: "Account Created Successfully",
            data: {user, workspace}, 
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Email already exists please login")
    }

  },
  sessionCookie(),
);

