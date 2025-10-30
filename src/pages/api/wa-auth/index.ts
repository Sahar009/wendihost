
import { withIronSessionApiRoute } from "iron-session/next";
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, getResellerInfo, getResellerInfoApi, sessionCookie } from '@/services/session';
import { comparePassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { sendTemplateOTP } from "@/services/waba/msg-templates";


  
export async function generateOtp(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
          return new ServerError(res, 401, "Missing Authorization header"); 
        }
      
        const apiKey: string = authHeader.split(' ')[1]; // 'Bearer your_token_here'
      
        if (!apiKey) {
          return new ServerError(res, 401, "Invalid Authorization header"); 
        }

        const { phone } = req.body

        const workspace = await prisma.workspace.findFirst({
            where: {
                apiKey: apiKey as any
            }
        })

        if (!workspace) {
            return new ServerError(res, 401, "Invalid API Key");
        }

        if (!workspace.accessToken) {
            return new ServerError(res, 401, "Please connect your WhatsApp Business Account");
        }

        const code = Math.floor(100000 + Math.random() * 900000);
        const time = 10;

        await sendTemplateOTP(workspace, phone, code.toString(), time.toString())

        return res.send({
            status: 'success',
            statusCode: 200,
            message: 'OTP sent successfully',
            data: ""
        });

    } catch (e) {
        return new ServerError(res, 500, "An unexpected error occurred")
    }

}
