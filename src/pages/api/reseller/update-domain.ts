import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApiNoWorkspace } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { User } from '@prisma/client';



export default withIronSessionApiRoute(
    async function updateDomain(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { domain, subdomain, name  } = req.body

            const user = await validateUserApiNoWorkspace(req)

            const data = user as User | null

            if (!data) return new ServerError(res, 401, "Unauthorized")

            const reseller = await prisma.reseller.findUnique({
                where: {
                    userId: Number(data?.id)
                }
            })

            console.log(data, reseller)

            if (reseller) {
                await prisma.reseller.update({
                    where: {
                        id: reseller.id
                    },
                    data: {
                        domain: domain,
                        subdomain:subdomain,
                        logoText: name
                    }
                })
            } else {
                await prisma.reseller.create({
                    data: {
                        userId: data.id,
                        domain: domain,
                        subdomain:subdomain,
                        logoText: name
                    }
                })
            }

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "Updated successfully",
                data: null
            });
            
        } catch (e) {
            return new ServerError(res,  400, "Bad Request")
        }

    },
    sessionCookie(),
);

