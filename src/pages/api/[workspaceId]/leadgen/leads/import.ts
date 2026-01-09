import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface ImportLeadsRequest extends NextApiRequest {
  body: {
    leads: Array<{
      businessName: string;
      phoneNumber: string;
      email?: string;
      address?: string;
      website?: string;
      businessType?: string;
    }>;
    campaignId?: number;
  };
}

export default withIronSessionApiRoute(
  async function importLeads(req: ImportLeadsRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { leads, campaignId } = req.body;

      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return new ServerError(res, 400, 'Leads array is required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const createdLeads = [];
      const skippedLeads = [];
      const errors = [];

      for (const leadData of leads) {
        try {
          // Validate required fields
          if (!leadData.businessName || !leadData.phoneNumber) {
            skippedLeads.push({
              businessName: leadData.businessName || 'Unknown',
              reason: 'Missing required fields',
            });
            continue;
          }

          // Check if lead already exists
          const existingLead = await prisma.lead.findUnique({
            where: {
              phoneNumber_workspaceId: {
                phoneNumber: leadData.phoneNumber,
                workspaceId: Number(workspaceId),
              },
            },
          });

          if (existingLead) {
            skippedLeads.push({
              businessName: leadData.businessName,
              reason: 'Already exists',
            });
            continue;
          }

          // Create lead
          const lead = await prisma.lead.create({
            data: {
              businessName: leadData.businessName,
              phoneNumber: leadData.phoneNumber,
              email: leadData.email,
              address: leadData.address,
              website: leadData.website,
              businessType: leadData.businessType,
              source: 'MANUAL_IMPORT',
              status: 'NEW',
              workspaceId: Number(workspaceId),
              campaignId: campaignId || null,
            },
          });

          createdLeads.push(lead);
        } catch (error: any) {
          errors.push({
            businessName: leadData.businessName,
            error: error.message,
          });
        }
      }

      // Update campaign stats if campaignId provided
      if (campaignId && createdLeads.length > 0) {
        await prisma.leadCampaign.update({
          where: { id: campaignId },
          data: {
            totalLeads: {
              increment: createdLeads.length,
            },
          },
        });
      }

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: `Successfully imported ${createdLeads.length} leads`,
        data: {
          imported: createdLeads.length,
          skipped: skippedLeads.length,
          errors: errors.length,
          details: {
            createdLeads: createdLeads.slice(0, 10),
            skippedLeads,
            errors,
          },
        },
      });
    } catch (error) {
      console.error('Error in leads/import:', error);
      return new ServerError(res, 500, 'Failed to import leads');
    }
  },
  sessionCookie()
);
