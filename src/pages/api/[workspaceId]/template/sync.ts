import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getTemplate } from '@/services/waba/msg-templates';
import { facebookAuth } from '@/services/facebook';
import { FACEBOOK_BASE_ENDPOINT } from '@/libs/constants';

export default withIronSessionApiRoute(
  async function syncTemplates(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
      const { workspaceId } = req.query;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");

      const { workspace } = validatedInfo;

      // Check if workspace has WhatsApp configured
      if (!workspace.accessToken || !workspace.whatsappId) {
        return new ServerError(res, 400, "WhatsApp Business API not configured. Please connect your Meta account first.");
      }

      console.log('🔄 Syncing templates from Facebook for workspace:', workspaceId);

      // Fetch templates from Facebook API with all fields
      const client = facebookAuth(workspace.accessToken);
      const response = await client.get(
        `${FACEBOOK_BASE_ENDPOINT}${workspace.whatsappId}/message_templates?fields=id,name,status,category,language,components,quality_score&limit=100`
      );

      const facebookTemplates = response.data.data || [];
      console.log(`📊 Found ${facebookTemplates.length} templates from Facebook API`);

      if (facebookTemplates.length === 0) {
        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: "No templates found on Facebook. Create templates in Meta Business Manager first.",
          data: []
        });
      }

      // Save or update templates in database
      const savedTemplates = [];
      let updatedCount = 0;
      let createdCount = 0;

      for (const template of facebookTemplates) {
        try {
          // Check if template already exists
          const existingTemplate = await prisma.template.findFirst({
            where: {
              templateId: template.id,
              workspaceId: Number(workspaceId)
            }
          });

          const templateData = {
            name: template.name,
            status: template.status || 'PENDING',
            category: template.category || 'MARKETING',
            language: template.language || 'en_US',
            components: JSON.stringify(template.components || []),
            templateId: template.id,
            workspaceId: Number(workspaceId)
          };

          if (existingTemplate) {
            // Update existing template
            const updated = await prisma.template.update({
              where: { id: existingTemplate.id },
              data: {
                ...templateData,
                updatedAt: new Date()
              }
            });
            savedTemplates.push(updated);
            updatedCount++;
          } else {
            // Create new template
            const created = await prisma.template.create({
              data: templateData
            });
            savedTemplates.push(created);
            createdCount++;
          }
        } catch (error: any) {
          console.error(`❌ Error saving template ${template.name}:`, error);
          // Continue with other templates even if one fails
        }
      }

      console.log(`✅ Synced ${savedTemplates.length} templates (${createdCount} new, ${updatedCount} updated)`);

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: `Successfully synced ${savedTemplates.length} templates from Facebook (${createdCount} new, ${updatedCount} updated)`,
        data: {
          total: savedTemplates.length,
          created: createdCount,
          updated: updatedCount,
          templates: savedTemplates.map(t => ({
            id: t.templateId,
            name: t.name,
            status: t.status,
            category: t.category,
            language: t.language,
            components: JSON.parse(t.components || '[]')
          }))
        }
      });

    } catch (error: any) {
      console.error('❌ Template sync error:', error);
      
      // Handle specific Facebook API errors
      if (error.response?.status === 401) {
        return new ServerError(res, 401, "Invalid or expired access token. Please reconnect your Meta account.");
      }
      
      if (error.response?.status === 403) {
        return new ServerError(res, 403, "Insufficient permissions. Please ensure your Meta account has 'whatsapp_business_management' permission.");
      }

      return new ServerError(
        res,
        500,
        error.response?.data?.error?.message || error.message || "Failed to sync templates from Facebook"
      );
    }
  },
  sessionCookie(),
);

