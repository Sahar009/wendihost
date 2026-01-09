import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface GetFormRequest extends NextApiRequest {
  query: {
    slug?: string;
    id?: string;
  };
}

export default async function getPublicForm(req: GetFormRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return new ServerError(res, 405, 'Method not allowed');
  }

  try {
    const { slug, id } = req.query;

    if (!slug && !id) {
      return new ServerError(res, 400, 'Slug or ID is required');
    }

    // Find form by slug or ID (public access)
    const form = await prisma.landingPage.findFirst({
      where: {
        OR: [
          slug ? { slug: String(slug) } : {},
          id ? { id: Number(id) } : {},
        ].filter(Boolean),
      },
    });

    if (!form) {
      return new ServerError(res, 404, 'Form not found');
    }

    // Increment view count
    await prisma.landingPage.update({
      where: { id: form.id },
      data: { views: (form.views || 0) + 1 },
    });

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Form retrieved successfully',
      data: form,
    });
  } catch (error) {
    console.error('Error in public forms/get:', error);
    return new ServerError(res, 500, 'Failed to retrieve form');
  }
}
