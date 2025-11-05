import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getWorkspace(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        status: 'failed', 
        statusCode: 405,
        message: 'Method not allowed',
        data: null
      });
    }

    try {
      const { workspaceId } = req.query;

      if (!workspaceId || typeof workspaceId !== 'string') {
        return res.status(400).json({ 
          status: 'failed', 
          statusCode: 400,
          message: 'Workspace ID is required',
          data: null
        });
      }

      // Validate user and workspace access
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, "Unauthorized");
      }

      // Fetch workspace data
      const workspace = await prisma.workspace.findUnique({
        where: { 
          id: Number(workspaceId) 
        },
        select: {
          id: true,
          name: true,
          description: true,
          workspaceId: true,
          ownerId: true,
          fbUserId: true,
          facebookAppId: true,
          facebookConfigId: true,
          facebookPageId: true,
          phone: true,
          accessToken: true,
          businessId: true,
          whatsappId: true,
          phoneId: true,
          apiKey: true,
          sync: true,
          lastSyncAt: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!workspace) {
        return res.status(404).json({ 
          status: 'failed', 
          statusCode: 404,
          message: 'Workspace not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Workspace data retrieved successfully',
        data: workspace
      });

    } catch (error) {
      console.error('Error fetching workspace:', error);
      return res.status(500).json({ 
        status: 'failed', 
        statusCode: 500,
        message: 'Internal server error',
        data: null
      });
    }
  },
  sessionCookie(),
);



