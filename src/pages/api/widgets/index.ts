import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApiNoWorkspace } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';

export default withIronSessionApiRoute(
  async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    try {
      const user = await validateUserApiNoWorkspace(req);
      if (!user) {
        return res.status(401).json({
          status: 'failed',
          statusCode: 401,
          message: 'Unauthorized',
          data: null
        });
      }

      const widgets = await prisma.whatsAppWidget.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              workspaceId: true
            }
          }
        }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Widgets retrieved successfully',
        data: widgets
      });
    } catch (error) {
      console.error('Error fetching widgets:', error);
      return res.status(500).json({
        status: 'failed',
        statusCode: 500,
        message: 'Failed to fetch widgets',
        data: null
      });
    }
  },
  sessionCookie()
);
