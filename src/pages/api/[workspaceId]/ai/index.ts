import { NextApiRequest, NextApiResponse } from 'next';
import { Prisma, PrismaClient } from '@prisma/client';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { workspaceId } = req.query;
  
  const validatedInfo = await validateUserApi(req, Number(workspaceId));
  if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");
  
  if (req.method === 'GET') {
    try {
      const assistants = await prisma.assistant.findMany({
        where: {
          workspaceId: Number(workspaceId),
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const formattedAssistants = assistants.map(assistant => ({
        ...assistant,
        knowledge: assistant.knowledge ? JSON.parse(assistant.knowledge as any) : null,
      }));
      
      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Assistants retrieved successfully',
        data: formattedAssistants,
      });
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return res.status(500).json({ 
        status: 'failed',
        statusCode: 500,
        message: 'Internal server error',
        data: null 
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, status, knowledge } = req.body;
      
      const newAssistant = await prisma.assistant.create({
        data: {
          name,
          description,
          status: status || 'active',
          knowledge: knowledge ? knowledge : Prisma.JsonNull,
          workspaceId: Number(workspaceId),
        },
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Assistant created successfully',
        data: {
          ...newAssistant,
          knowledge: newAssistant.knowledge ? JSON.parse(newAssistant.knowledge as any) : null,
        },
      });
    } catch (error) {
      console.error('Error creating assistant:', error);
      return res.status(500).json({ 
        status: 'failed',
        statusCode: 500,
        message: 'Internal server error',
        data: null 
      });
    }
  }

  return res.status(405).json({ 
    status: 'failed',
    statusCode: 405,
    message: 'Method not allowed',
    data: null 
  });
}

export default withIronSessionApiRoute(handler, sessionCookie());
