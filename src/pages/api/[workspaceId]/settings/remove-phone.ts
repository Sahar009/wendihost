import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function removePhoneNumber(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'DELETE') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;

      if (!workspaceId || typeof workspaceId !== 'string') {
        return new ServerError(res, 400, 'Workspace ID is required');
      }

      // Validate user and workspace access
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { workspace } = validatedInfo;

      // Check if workspace has a phone number
      if (!workspace.phone && !workspace.phoneId) {
        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'No phone number associated with this workspace',
          data: null
        });
      }

      // Remove phone-related fields only
      // Note: We keep Facebook config fields (fbUserId, facebookAppId, facebookConfigId, facebookPageId) 
      // as they may be used for Meta Ads and are separate from WhatsApp phone number
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          phone: null,
          phoneId: null,
          whatsappId: null,
          businessId: null,
          accessToken: null,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          phoneId: true,
          whatsappId: true,
          businessId: true,
          updatedAt: true,
        }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Phone number removed from workspace successfully',
        data: updatedWorkspace
      });

    } catch (error: any) {
      console.error('Error removing phone number:', error);
      return new ServerError(res, 500, 'Failed to remove phone number from workspace');
    }
  },
  sessionCookie(),
);
