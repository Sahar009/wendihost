import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { validateTrigger } from '@/libs/utils';


export default withIronSessionApiRoute(
  async function saveTrigger(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

        const workspaceId = req.query.workspaceId
        const id = req.query.id

        const { trigger } = req.body

        const validatedInfo = await validateUserApi(req, Number(workspaceId))

        if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

        const chatTrigger = validateTrigger(trigger)

        const triggerExist = await prisma.chatbot.findFirst({
            where: {
                workspaceId: Number(workspaceId),
                trigger: chatTrigger,
                NOT: {
                    id: Number(id),
                }
            }, 
        
        })

        if (triggerExist) return new ServerError(res, 400, "Trigger Already exist")

        const defaultExist = await prisma.chatbot.findFirst({
            where: {
                workspaceId: Number(workspaceId),
                default: true,
                NOT: {
                    id: Number(id),
                }
            }, 
        
        })

        if (defaultExist) return new ServerError(res, 400, "You can only have one default chatbot")

        const chatbot = await prisma.chatbot.updateMany({
            where: {
                id: Number(id),
                workspaceId: Number(workspaceId)
            },
            data: {
                trigger: chatTrigger
            }
        })

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Save successfully",
            data: chatbot
        });
        
    } catch (e) {
        return new ServerError(res,  400, "Bad Request")
    }

    },
    sessionCookie(),
);

