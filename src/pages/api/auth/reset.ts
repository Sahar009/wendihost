
import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createSession, sessionCookie } from '@/services/session';
import { comparePassword, hashPassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


  
export default withIronSessionApiRoute(
  async function resetRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { token, password } = req.body

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
            },
        })

        if (!user) throw new Error()

        if (Number(user.tokenExpireAt) < Date.now()) 
            return new ServerError(res, 400, "Token has Expired")

        const hash = await hashPassword(password)

        await prisma.user.update({
            where: {
                email: user.email
            },
            data: {
                password: hash,
                tokenExpireAt: new Date(),
                resetToken: undefined
            }
        })

        return res.send({ 
            status: 'success', 
            statusCode: 200, 
            message: 'Password updated successfully', 
            data: null 
        });
    
    } catch (e) {
        return new ServerError(res, 400, "Invalid Token")
    }

  },
  sessionCookie(),
);

