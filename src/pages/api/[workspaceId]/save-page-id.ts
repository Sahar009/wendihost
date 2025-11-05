import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function savePageId(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { pageId } = req.body;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      if (!pageId) {
        return new ServerError(res, 400, 'Page ID is required');
      }

      // Update workspace with page ID
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: Number(workspaceId) },
        data: { facebookPageId: pageId }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Page ID saved successfully',
        data: updatedWorkspace
      });
    } catch (error) {
      console.error('Error in save-page-id:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie(),
);

