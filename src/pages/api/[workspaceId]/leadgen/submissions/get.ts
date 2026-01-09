import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getSubmissions(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, id } = req.query;

      console.log('Submissions API - Session:', (req.session as any)?.user);
      console.log('Submissions API - WorkspaceId:', workspaceId);
      
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        console.log('Submissions API - Validation failed');
        return new ServerError(res, 401, 'Unauthorized');
      }
      
      console.log('Submissions API - Validation successful:', validatedInfo.user.email);

      // Get single submission by ID
      if (id) {
        const submission = await prisma.formSubmission.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
          include: {
            landingPage: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            lead: {
              select: {
                id: true,
                businessName: true,
                phoneNumber: true,
                email: true,
                status: true,
              },
            },
          },
        });

        if (!submission) {
          return new ServerError(res, 404, 'Submission not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Submission fetched successfully',
          data: submission,
        });
      }

      // Get all submissions
      const submissions = await prisma.formSubmission.findMany({
        where: {
          workspaceId: Number(workspaceId),
        },
        include: {
          landingPage: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          lead: {
            select: {
              id: true,
              businessName: true,
              phoneNumber: true,
              email: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Submissions fetched successfully',
        data: submissions,
      });
    } catch (error) {
      console.error('Error in submissions/get:', error);
      return new ServerError(res, 500, 'Failed to fetch submissions');
    }
  },
  sessionCookie()
);
