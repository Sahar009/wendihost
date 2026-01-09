import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function getForms(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'GET') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId, id, slug } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Get single form by ID
      if (id) {
        const form = await prisma.landingPage.findFirst({
          where: {
            id: Number(id),
            workspaceId: Number(workspaceId),
          },
          include: {
            formSubmissions: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            _count: {
              select: {
                formSubmissions: true,
                campaigns: true,
              },
            },
          },
        });

        if (!form) {
          return new ServerError(res, 404, 'Form not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Form fetched successfully',
          data: form,
        });
      }

      // Get single form by slug
      if (slug) {
        const form = await prisma.landingPage.findUnique({
          where: { slug: String(slug) },
        });

        if (!form) {
          return new ServerError(res, 404, 'Form not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Form fetched successfully',
          data: form,
        });
      }

      // Get all forms
      const forms = await prisma.landingPage.findMany({
        where: {
          workspaceId: Number(workspaceId),
        },
        include: {
          _count: {
            select: {
              formSubmissions: true,
              campaigns: true,
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
        message: 'Forms fetched successfully',
        data: forms,
      });
    } catch (error) {
      console.error('Error in forms/get:', error);
      return new ServerError(res, 500, 'Failed to fetch forms');
    }
  },
  sessionCookie()
);
