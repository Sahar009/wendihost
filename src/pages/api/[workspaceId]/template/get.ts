
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse, TEMPLATE_STATUS } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getTemplate } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, status } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

        // Fetch templates from database instead of Facebook API
        const templates = await prisma.template.findMany({
            where: {
                workspaceId: Number(workspaceId),
                ...(status && { status: status as string })
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Transform database templates to match expected format
        const transformedTemplates = templates.map(template => ({
            id: template.templateId,
            name: template.name,
            status: template.status,
            category: template.category,
            language: template.language,
            components: JSON.parse(template.components || '[]')
        }))

        // If no templates in database, try Facebook API as fallback
        if (transformedTemplates.length === 0) {
            console.log('No templates in database, trying Facebook API...')
            const facebookTemplates = (await getTemplate(workspace, status as TEMPLATE_STATUS))?.data
            return res.send({ 
                status: 'success', 
                statusCode: 200,
                message: "fetch was successful",
                data: facebookTemplates || [], 
            });
        }

        const template = transformedTemplates

        return res.send({ 
            status: 'success', 
            statusCode: 200,
            message: "fetch was successful",
            data: template, 
        });
        
    } catch (e) {
        console.error('Template API error:', e)
        return new ServerError(res, 500, "Failed to fetch templates")
    }

  },
  sessionCookie(),
);

