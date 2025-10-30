import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { Member, User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function getInfo(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { workspaceId, phone } = req.query

            const { firstName, lastName, email, chatId } = req.body
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

            const contact = await prisma.contact.updateMany({
                where: {
                    workspaceId: Number(workspaceId),
                    phone: String(phone)
                }, 
                data: {
                    firstName,
                    lastName,
                    email,
                    workspaceId: Number(workspaceId),
                    phone: String(phone),
                    conversationId: chatId
                }
            })

            if (contact?.count === 0) {

                await prisma.contact.create({
                    data: {
                        firstName: String(firstName),
                        lastName: String(lastName),
                        email: String(email),
                        workspaceId: Number(workspaceId),
                        phone: String(phone),
                        conversationId: chatId
                    }
                })

            }
   
            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Saved successfully",
                data: null, 
            });
            
        } catch (e) {
            return new ServerError(res,  500, "Internal server error")
        }

    },
    sessionCookie(),
);

