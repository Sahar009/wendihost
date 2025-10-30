import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

async function handleRequest(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return new ServerError(res, 400, 'Campaign ID is required');
  }

  try {
    if (req.method === 'GET') {
      return await handleGetCampaign(req, res, id);
    } else if (req.method === 'PUT') {
      return await handleUpdateCampaign(req, res, id);
    } else if (req.method === 'DELETE') {
      return await handleDeleteCampaign(req, res, id);
    } else {
      return new ServerError(res, 405, 'Method not allowed');
    }
  } catch (error: any) {
    console.error('Campaign API error:', error);
    return new ServerError(
      res,
      500,
      error.message || 'An error occurred'
    );
  }
}

async function handleGetCampaign(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  id: string
) {
  const { workspaceId } = req.query;
  
  if (!workspaceId || Array.isArray(workspaceId)) {
    return new ServerError(res, 400, 'Workspace ID is required');
  }

  const validatedInfo = await validateUserApi(req, Number(workspaceId));
  if (!validatedInfo) {
    return new ServerError(res, 401, 'Unauthorized');
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(id),
      workspaceId: Number(workspaceId),
    },
    include: {
      sequences: {
        orderBy: {
          date: 'asc',
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!campaign) {
    return new ServerError(res, 404, 'Campaign not found');
  }

  return res.status(200).json({
    status: 'success' as const,
    statusCode: 200 as const,
    message: 'Campaign retrieved successfully',
    data: campaign,
  });
}

async function handleUpdateCampaign(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  id: string
) {
  return new ServerError(res, 500, 'Not implemented');
}

async function handleDeleteCampaign(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  id: string
) {
  const { workspaceId } = req.query;
  
  if (!workspaceId || Array.isArray(workspaceId)) {
    return new ServerError(res, 400, 'Workspace ID is required');
  }

  const validatedInfo = await validateUserApi(req, Number(workspaceId));
  if (!validatedInfo) {
    return new ServerError(res, 401, 'Unauthorized');
  }

  try {
    await prisma.campaign.deleteMany({
      where: {
        id: Number(id),
        workspaceId: Number(workspaceId),
        userId: validatedInfo.user.id,
      },
    });

    return res.status(200).json({
      status: 'success' as const,
      statusCode: 200 as const,
      message: 'Campaign deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return new ServerError(res, 500, 'Failed to delete campaign');
  }
}

export default withIronSessionApiRoute(handleRequest, sessionCookie());
