import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { validateTrigger } from '@/libs/utils';

export default withIronSessionApiRoute(
  async function updateChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

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
      const { name, trigger } = req.body;

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

      const updateData: any = {};
      
      if (name !== undefined) {
        updateData.name = String(name);
      }
      
      if (trigger !== undefined) {
        const validatedTrigger = validateTrigger(trigger);
        
        const existingChatbot = await prisma.chatbot.findFirst({
          where: {
            workspaceId: Number(workspaceId),
            trigger: validatedTrigger,
            id: { not: Number(id) } 
          }
        });

        if (existingChatbot) {
          return res.status(400).json({
            status: 'failed',
            statusCode: 400,
            message: 'Trigger already exists for another chatbot in this workspace',
            data: null
          });
        }

        updateData.trigger = validatedTrigger;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          status: 'failed',
          statusCode: 400,
          message: 'No valid data provided for update',
          data: null
        });
      }

      const updatedChatbot = await prisma.chatbot.update({
        where: {
          id: Number(id),
          workspaceId: Number(workspaceId)
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          trigger: true,
          workspaceId: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Chatbot updated successfully',
        data: updatedChatbot
      });

    } catch (error) {
      console.error('Error updating chatbot:', error);
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
