import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import ServerError from '@/services/errors/serverError';
import { ApiResponse } from '@/libs/types';

export default withIronSessionApiRoute(
  async function assistantHandler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    try {
      const workspaceId = Number(req.query.workspaceId);
      if (!workspaceId) return new ServerError(res, 400, 'workspaceId is required');

      const db = prisma as any;

      if (req.method === 'GET') {
        const validatedInfo = await validateUserApi(req, workspaceId);
        if (!validatedInfo) return new ServerError(res, 401, 'Unauthorized');

        const assistants = await db.assistant.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
        });

        return res.send({
          status: 'success',
          statusCode: 200,
          message: 'Assistants fetched successfully',
          data: assistants,
        });
      }

      if (req.method === 'POST') {
        const { name, description, status, knowledge } = req.body as {
          name: string;
          description?: string | null;
          status?: string;
          knowledge?: { text: string | null; documents: { url: string; filename?: string; type?: string; size?: number }[] };
        };

        if (!name) return new ServerError(res, 400, 'Missing required fields');

        const validatedInfo = await validateUserApi(req, workspaceId);
        if (!validatedInfo) return new ServerError(res, 401, 'Unauthorized');

        const assistant = await db.assistant.create({
          data: {
            name: String(name),
            description: description ? String(description) : null,
            status: status ? String(status) : 'active',
            knowledge: knowledge ? JSON.stringify(knowledge) : null,
            workspace: { connect: { id: workspaceId } },
          },
        });

        return res.status(201).send({
          status: 'success',
          statusCode: 201,
          message: 'Assistant created successfully',
          data: assistant,
        });
      }

      return new ServerError(res, 405, 'Method not allowed');
    } catch (e: any) {
      return new ServerError(res, 500, e?.message || 'Server Error');
    }
  },
  sessionCookie()
);


