
import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, getResellerInfo, getResellerInfoApi, sessionCookie } from '@/services/session';
import { comparePassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';


  
export default withIronSessionApiRoute(
  async function loginRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const { email, password } = req.body

        const reseller  = await getResellerInfoApi(req)

        let user = null

        if (reseller)   {
            user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    resellerId: reseller.id
                },
            })

        } else {
            user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    resellerId: 0
                },
            })
        }

        if (!user) throw new Error()

        if(await comparePassword(password, user.password)) {

            user.password = ""

            await createSession(user, req)
    
            return res.send({ status: 'success', statusCode: 200, message: 'Authentication successful redirecting...', data: user });
    
        };
        
        return new ServerError(res, 400, "Email or Password is incorrect")

    } catch (e) {
        return new ServerError(res, 400, "Email or Password is incorrect")
    }

  },
  sessionCookie(),
);

