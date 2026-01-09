import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface UpdateFormRequest extends NextApiRequest {
  body: {
    id: number;
    name?: string;
    title?: string;
    description?: string;
    logoUrl?: string;
    backgroundColor?: string;
    primaryColor?: string;
    submitButtonText?: string;
    thankYouMessage?: string;
  };
}

export default withIronSessionApiRoute(
  async function updateForm(req: UpdateFormRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'PUT') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { id, ...updateData } = req.body;

      if (!id) {
        return new ServerError(res, 400, 'Form ID is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Check if form exists and belongs to workspace
      const existingForm = await prisma.landingPage.findFirst({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId),
        },
      });

      if (!existingForm) {
        return new ServerError(res, 404, 'Form not found');
      }

      // Update the form
      const updatedForm = await prisma.landingPage.update({
        where: { id: Number(id) },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Form updated successfully',
        data: updatedForm,
      });
    } catch (error) {
      console.error('Error in forms/update:', error);
      return new ServerError(res, 500, 'Failed to update form');
    }
  },
  sessionCookie()
);
