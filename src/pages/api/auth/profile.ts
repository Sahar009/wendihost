import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { validateUserApiNoWorkspace, sessionCookie } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function profileRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    if (req.method !== 'GET') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
        const user = await validateUserApiNoWorkspace(req);

        if (!user) {
            return new ServerError(res, 401, "Unauthorized");
        }

        // Get user profile data
        const userProfile = await prisma.user.findUnique({
            where: {
                id: user.id
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

        if (!userProfile) {
            return new ServerError(res, 404, "User not found");
        }
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Profile fetched successfully",
            data: userProfile, 
        });
        
    } catch (e) {
        console.error('Get profile error:', e);
        return new ServerError(res, 500, "Failed to fetch profile");
    }

  },
  sessionCookie(),
); 