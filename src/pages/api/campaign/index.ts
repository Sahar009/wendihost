import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';  
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

async function handleRequest(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    if (req.method === 'GET') {
      return await handleGetCampaigns(req, res);
    } else if (req.method === 'POST') {
      return await handleCreateCampaign(req, res);
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

async function handleGetCampaigns(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { workspaceId } = req.query;
  
  if (!workspaceId || Array.isArray(workspaceId)) {
    return new ServerError(res, 400, 'Workspace ID is required');
  }

  const validatedInfo = await validateUserApi(req, Number(workspaceId));
  if (!validatedInfo) {
    return new ServerError(res, 401, 'Unauthorized');
  }

  const { user } = validatedInfo;

  const campaigns = await prisma.campaign.findMany({
    where: {
      userId: user.id,
      workspaceId: Number(workspaceId)
    },
    include: {
      sequences: true,
      workspace: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(200).json({
    status: 'success',
    statusCode: 200,
    data: campaigns,
    message: "Campaigns fetched successfully",
  });
}

async function handleCreateCampaign(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const {
    name,
    category,
    startDate,
    endDate,
    workspaceId,
    trigger,
    messageType,
    image,
    sequences = [],
    responseTemplate,
  } = req.body;

  if (!name || !category || !startDate || !endDate || !workspaceId) {
    return new ServerError(res, 400, 'Missing required fields');
  }

  const validatedInfo = await validateUserApi(req, Number(workspaceId));
  if (!validatedInfo) {
    return new ServerError(res, 401, 'Unauthorized');
  }

  const { user } = validatedInfo;

  const campaign = await prisma.campaign.create({
    data: {
      name,
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      workspace: {
        connect: { id: Number(workspaceId) }
      },
      user: {
        connect: { id: user.id }
      },
      trigger,
      messageType,
      image,
      responseTemplate,
      sequences: {
        create: sequences.map((seq: any) => ({
          date: new Date(seq.date),
          time: seq.time,
          template: seq.template,
          status: 'pending',
        })),
      },
    },
    include: { sequences: true },
  });

  return res.status(201).json({
    status: 'success',
    statusCode: 201,
    message: 'Campaign created successfully',
    data: campaign,
  });
}

export default withIronSessionApiRoute(handleRequest, sessionCookie());