import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { validateUserApiNoWorkspace, sessionCookie } from '@/services/session';
import { comparePassword, hashPassword } from "@/services/functions";
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function changePasswordRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return new ServerError(res, 400, "Current password and new password are required");
        }

        if (newPassword.length < 6) {
            return new ServerError(res, 400, "New password must be at least 6 characters long");
        }

        const user = await validateUserApiNoWorkspace(req);

        if (!user) {
            return new ServerError(res, 401, "Unauthorized");
        }

        // Get user with password for comparison
        const userWithPassword = await prisma.user.findUnique({
            where: {
                id: user.id
            },
            select: {
                id: true,
                password: true,
                email: true
            }
        });

        if (!userWithPassword) {
            return new ServerError(res, 404, "User not found");
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, userWithPassword.password);
        
        if (!isCurrentPasswordValid) {
            return new ServerError(res, 400, "Current password is incorrect");
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedNewPassword
            }
        });
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Password changed successfully",
            data: null, 
        });
        
    } catch (e) {
        console.error('Change password error:', e);
        return new ServerError(res, 500, "Failed to change password");
    }

  },
  sessionCookie(),
); 