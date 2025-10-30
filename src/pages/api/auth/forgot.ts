import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCookie } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import crypto from 'crypto';
import { DOMAIN, RESET_TIME } from "@/libs/constants";
import { passwordResetMail } from "@/services/sendMail";


  
export default withIronSessionApiRoute(
  async function forgotRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { email } = req.body

        const resetToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.update({
            where: {
                email: email.toLowerCase(),
            },
            data: {
                resetToken,
                tokenExpireAt: new Date(Date.now() + RESET_TIME)
            }
        })

        if (!user) throw new Error()

        const url = `${DOMAIN}/auth/reset/${resetToken}`

        await passwordResetMail(user.firstName, email, url)

        return res.send(
            {
                status: "success",
                statusCode: 200,
                message: "Reset email sent, the mail will expire in 1 hour",
                data: null
            }
        )
        
    } catch (e) { 
        return new ServerError(res, 400, "Account Not Found")
    }


  },
  sessionCookie(),
);

