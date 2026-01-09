import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface CreateFormRequest extends NextApiRequest {
  body: {
    name: string;
    slug: string;
    title: string;
    description?: string;
    logoUrl?: string;
    backgroundColor?: string;
    primaryColor?: string;
    formFields: any[];
    submitButtonText?: string;
    thankYouMessage?: string;
  };
}

export default withIronSessionApiRoute(
  async function createForm(req: CreateFormRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const {
        name,
        slug,
        title,
        description,
        logoUrl,
        backgroundColor,
        primaryColor,
        formFields,
        submitButtonText,
        thankYouMessage,
      } = req.body;

      if (!name || !slug || !title || !formFields) {
        return new ServerError(res, 400, 'Name, slug, title, and form fields are required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      // Check if slug already exists
      const existingForm = await prisma.landingPage.findUnique({
        where: { slug },
      });

      if (existingForm) {
        return new ServerError(res, 400, 'A form with this slug already exists');
      }

      const landingPage = await prisma.landingPage.create({
        data: {
          name,
          slug,
          title,
          description,
          logoUrl,
          backgroundColor: backgroundColor || '#ffffff',
          primaryColor: primaryColor || '#4F46E5',
          formFields,
          submitButtonText: submitButtonText || 'Submit',
          thankYouMessage: thankYouMessage || 'Thank you for your interest!',
          workspaceId: Number(workspaceId),
        },
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Landing page created successfully',
        data: landingPage,
      });
    } catch (error) {
      console.error('Error in forms/create:', error);
      return new ServerError(res, 500, 'Failed to create landing page');
    }
  },
  sessionCookie()
);
