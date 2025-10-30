import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import ServerError from '@/services/errors/serverError';
import { ApiResponse } from '@/libs/types';

export default withIronSessionApiRoute(
  async function assistantByIdHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    try {
      const workspaceId = Number(req.query.workspaceId);
      const id = Number(req.query.id);
      if (!workspaceId || !id) return new ServerError(res, 400, 'workspaceId and id are required');

      const validatedInfo = await validateUserApi(req, workspaceId);
      if (!validatedInfo) return new ServerError(res, 401, 'Unauthorized');

      const db = prisma as any;

      if (req.method === 'PUT' || req.method === 'PATCH') {
        const { name, description, status, knowledge } = req.body as {
          name?: string;
          description?: string | null;
          status?: string;
          knowledge?: { text: string | null; documents: { url: string; filename?: string; type?: string; size?: number }[] } | null;
        };

        const existing = await db.assistant.findFirst({ where: { id, workspaceId } });
        if (!existing) return new ServerError(res, 404, 'Assistant not found');

        const updated = await db.assistant.update({
          where: { id },
          data: {
            name: typeof name === 'string' ? name : undefined,
            description: description === undefined ? undefined : description,
            status: typeof status === 'string' ? status : undefined,
            knowledge: knowledge === undefined ? undefined : knowledge ? JSON.stringify(knowledge) : null,
          },
        });

        return res.send({
          status: 'success',
          statusCode: 200,
          message: 'Assistant updated successfully',
          data: updated,
        });
      }

      if (req.method === 'DELETE') {
        const existing = await db.assistant.findFirst({ where: { id, workspaceId } });
        if (!existing) return new ServerError(res, 404, 'Assistant not found');

        await db.assistant.delete({ where: { id } });

        return res.send({
          status: 'success',
          statusCode: 200,
          message: 'Assistant deleted successfully',
          data: { id },
        });
      }

      return new ServerError(res, 405, 'Method not allowed');
    } catch (e: any) {
      return new ServerError(res, 500, e?.message || 'Server Error');
    }
  },
  sessionCookie()
);


