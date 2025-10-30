import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function deleteTemplateRoute(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }
    try {
      const { id } = req.body;
      const { workspaceId } = req.query;
      if (!id) {
        return new ServerError(res, 400, "Template id is required");
      }
      const userSession = await validateUserApi(req, Number(workspaceId));
      if (!userSession) {
        return new ServerError(res, 401, "Unauthorized");
      }
      const template = await prisma.template.findUnique({
        where: { id: Number(id) }
      });
      if (!template || template.workspaceId !== Number(workspaceId)) {
        return new ServerError(res, 404, "Template not found or not in this workspace");
      }
      await prisma.template.delete({
        where: { id: Number(id) }
      });
      return res.send({
        status: 'success',
        statusCode: 200,
        message: 'Template deleted successfully',
        data: null
      });
    } catch (e) {
      console.error('Delete template error:', e);
      return new ServerError(res, 500, "Failed to delete template");
    }
  },
  sessionCookie()
); 