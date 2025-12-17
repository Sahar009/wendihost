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

            const { domain, subdomain, name, logo  } = req.body

            const user = await validateUserApiNoWorkspace(req)

            const data = user as User | null

            if (!data) return new ServerError(res, 401, "Unauthorized")

            const reseller = await prisma.reseller.findUnique({
                where: {
                    userId: Number(data?.id)
                }
            })

            console.log('Update request:', { domain, subdomain, name, logo, resellerId: reseller?.id })

            const updateData: any = {
                domain: domain?.trim() || '',
                subdomain: subdomain?.trim() || '',
                logoText: name?.trim() || ''
            }

            // Only update logo if provided (not undefined)
            if (logo !== undefined && logo !== null) {
                updateData.logo = logo;
            }

            if (reseller) {
                // Update existing reseller
                try {
                    await prisma.reseller.update({
                        where: {
                            id: reseller.id
                        },
                        data: updateData
                    })
                    console.log('Reseller updated successfully')
                } catch (updateError: any) {
                    console.error('Update error:', updateError)
                    // Handle unique constraint errors
                    if (updateError.code === 'P2002') {
                        const field = updateError.meta?.target?.[0] || 'field'
                        return new ServerError(res, 400, `${field === 'domain' ? 'Domain' : field === 'subdomain' ? 'Subdomain' : 'Field'} already exists. Please choose a different one.`)
                    }
                    throw updateError
                }
            } else {
                // Create new reseller
                try {
                    await prisma.reseller.create({
                        data: {
                            userId: data.id,
                            ...updateData
                        }
                    })
                    console.log('Reseller created successfully')
                } catch (createError: any) {
                    console.error('Create error:', createError)
                    // Handle unique constraint errors
                    if (createError.code === 'P2002') {
                        const field = createError.meta?.target?.[0] || 'field'
                        return new ServerError(res, 400, `${field === 'domain' ? 'Domain' : field === 'subdomain' ? 'Subdomain' : 'Field'} already exists. Please choose a different one.`)
                    }
                    throw createError
                }
            }

            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: reseller ? "Updated successfully" : "Created successfully",
                data: null
            });
            
        } catch (e: any) {
            console.error('API Error:', e)
            const errorMessage = e?.message || 'Bad Request'
            return new ServerError(res, 400, errorMessage)
        }

    },
    sessionCookie(),
);

