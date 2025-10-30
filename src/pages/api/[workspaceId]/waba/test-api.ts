
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';
import { sendTemplateOTP } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
    async function testApi(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId } = req.query

            const { phone } = req.body

            const validatedInfo = await validateUserApi(req, Number(workspaceId))

            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

            const { workspace } = validatedInfo 

            const code = Math.floor(100000 + Math.random() * 900000);
            const time = 10;

            await sendTemplateOTP(workspace, phone, code.toString(), time.toString())

            return res.send({
                status: 'success',
                statusCode: 200,
                message: 'OTP sent successfully',
                data: code
            });

        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

