import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import { Prisma } from '@prisma/client';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    try {
      const { workspaceId, id } = req.query;
      
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");
    
    if (!workspaceId || !id) {
      return res.status(400).json({ 
        status: 'failed',
        statusCode: 400,
        message: 'Missing workspaceId or id',
        data: null
      });
    }
  
    if (req.method === 'GET') {
      try {
        const assistant = await prisma.assistant.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
        });

        if (!assistant) {
          return res.status(404).json({ 
            status: 'failed',
            statusCode: 404,
            message: 'Assistant not found',
            data: null
          });
        }

        let knowledge = null;
        if (assistant.knowledge) {
          try {
            knowledge = typeof assistant.knowledge === 'string' 
              ? JSON.parse(assistant.knowledge) 
              : assistant.knowledge;
          } catch (e) {
            console.error('Error parsing knowledge JSON:', e);
            knowledge = null;
          }
        }
        
        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Assistant retrieved successfully',
          data: {
            ...assistant,
            knowledge,
          },
        });
      } catch (error) {
        console.error('Error fetching assistant:', error);
        return res.status(500).json({ 
          status: 'failed',
          statusCode: 500,
          message: 'Internal server error',
          data: null
        });
      }
    }
    
    if (req.method === 'PUT') {
      try {
        const { name, description, status, knowledge } = req.body;
        
        if (!name) {
          return res.status(400).json({
            status: 'failed',
            statusCode: 400,
            message: 'Name is required',
            data: null
          });
        }

        const updateData: any = {
          name: name.trim(),
          description: description?.trim() || null,
          status: status || 'active',
        };

        if (knowledge) {
          updateData.knowledge = typeof knowledge === 'string' 
            ? knowledge 
            : JSON.stringify(knowledge);
        } else {
          updateData.knowledge = Prisma.JsonNull;
        }

        const updatedAssistant = await prisma.assistant.update({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
          data: updateData,
        });

        let parsedKnowledge = null;
        if (updatedAssistant.knowledge) {
          try {
            parsedKnowledge = typeof updatedAssistant.knowledge === 'string'
              ? JSON.parse(updatedAssistant.knowledge)
              : updatedAssistant.knowledge;
          } catch (e) {
            console.error('Error parsing knowledge JSON:', e);
            parsedKnowledge = null;
          }
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Assistant updated successfully',
          data: {
            ...updatedAssistant,
            knowledge: parsedKnowledge,
          },
        });
      } catch (error: any) {
        console.error('Error updating assistant:', error);
        return res.status(500).json({
          status: 'failed',
          statusCode: 500,
          message: 'Failed to update assistant',
          data: null
        });
      }
    }
    
    if (req.method === 'DELETE') {
      try {
        const existingAssistant = await prisma.assistant.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
        });

        if (!existingAssistant) {
          return res.status(404).json({
            status: 'failed',
            statusCode: 404,
            message: 'Assistant not found',
            data: null
          });
        }

        await prisma.assistant.delete({
          where: {
            id: Number(id),
          },
        });

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Assistant deleted successfully',
          data: null
        });
      } catch (error: any) {
        console.error('Error deleting assistant:', error);
        return res.status(500).json({
          status: 'failed',
          statusCode: 500,
          message: 'Failed to delete assistant',
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
    
  } catch (error: any) {
    console.error('Error in API route:', error);
    return new ServerError(res, 500, 'Internal server error');
  }
},
sessionCookie()
);
