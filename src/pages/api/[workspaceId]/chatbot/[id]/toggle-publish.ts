import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function togglePublishChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    if (req.method !== 'PUT') {
      return res.status(405).json({
        status: 'failed',
        statusCode: 405,
        message: 'Method not allowed',
        data: null
      });
    }

    try {
      const workspaceId = req.query.workspaceId;
      const id = req.query.id;

      if (!workspaceId || typeof workspaceId !== 'string') {
        return res.status(400).json({
          status: 'failed',
          statusCode: 400,
          message: 'Workspace ID is required',
          data: null
        });
      }

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          status: 'failed',
          statusCode: 400,
          message: 'Chatbot ID is required',
          data: null
        });
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, "Unauthorized");
      }

      // Get current chatbot to check publish status
      const currentChatbot = await prisma.chatbot.findFirst({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId)
        },
        select: {
          id: true,
          name: true,
          publish: true
        }
      });

      if (!currentChatbot) {
        return res.status(404).json({
          status: 'failed',
          statusCode: 404,
          message: 'Chatbot not found',
          data: null
        });
      }

      // Toggle publish status
      const updatedChatbot = await prisma.chatbot.update({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId)
        },
        data: {
          publish: !currentChatbot.publish
        },
        select: {
          id: true,
          name: true,
          trigger: true,
          publish: true,
          default: true,
          workspaceId: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: `Chatbot ${updatedChatbot.publish ? 'published' : 'unpublished'} successfully`,
        data: updatedChatbot
      });

    } catch (error) {
      console.error('Error toggling chatbot publish status:', error);
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
