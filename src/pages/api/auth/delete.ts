import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { validateUserApiNoWorkspace, sessionCookie } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function deleteRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
        const user = await validateUserApiNoWorkspace(req);

        if (!user) {
            return new ServerError(res, 401, "Unauthorized");
        }

        // Delete user's workspaces first (cascade delete)
        await prisma.workspace.deleteMany({
            where: {
                ownerId: user.id
            }
        });

        // Delete user's memberships
        await prisma.member.deleteMany({
            where: {
                email: user.email
            }
        });

        // Delete the user
        await prisma.user.delete({
            where: {
                id: user.id
            }
        });

        // Destroy the session
        await req.session.destroy();
        
        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "Account deleted successfully",
            data: null, 
        });
        
    } catch (e) {
        console.error('Delete account error:', e);
        return new ServerError(res, 500, "Failed to delete account");
    }

  },
  sessionCookie(),
); 