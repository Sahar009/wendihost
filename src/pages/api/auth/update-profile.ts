import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { validateUserApiNoWorkspace, sessionCookie } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function updateProfileRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
        const { firstName, lastName, email } = req.body;

        if (!firstName || !lastName || !email) {
            return new ServerError(res, 400, "First name, last name, and email are required");
        }

        const user = await validateUserApiNoWorkspace(req);

        if (!user) {
            return new ServerError(res, 401, "Unauthorized");
        }

        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                id: {
                    not: user.id
                }
            }
        });

        if (existingUser) {
            return new ServerError(res, 400, "Email is already taken by another user");
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                firstName,
                lastName,
                email: email.toLowerCase()
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Profile updated successfully",
            data: updatedUser, 
        });
        
    } catch (e) {
        console.error('Update profile error:', e);
        return new ServerError(res, 500, "Failed to update profile");
    }

  },
  sessionCookie(),
); 