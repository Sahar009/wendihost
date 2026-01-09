import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface UpdateLeadRequest extends NextApiRequest {
  body: {
    id: number;
    status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'CONVERTED' | 'INVALID';
    notes?: string;
    tags?: string[];
    email?: string;
    website?: string;
    customData?: any;
  };
}

export default withIronSessionApiRoute(
  async function updateLead(req: UpdateLeadRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { id, ...updateData } = req.body;

      if (!id) {
        return new ServerError(res, 400, 'Lead ID is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Check if lead exists and belongs to workspace
      const existingLead = await prisma.lead.findFirst({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId),
        },
      });

      if (!existingLead) {
        return new ServerError(res, 404, 'Lead not found');
      }

      // Update lead
      const lead = await prisma.lead.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      console.error('Error in leads/update:', error);
      return new ServerError(res, 500, 'Failed to update lead');
    }
  },
  sessionCookie()
);
