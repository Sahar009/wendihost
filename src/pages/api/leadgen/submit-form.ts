import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface SubmitFormRequest extends NextApiRequest {
  body: {
    slug: string;
    formData: any;
    phoneNumber?: string;
    email?: string;
  };
}

export default async function submitForm(req: SubmitFormRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return new ServerError(res, 405, 'Method not allowed');
  }

  try {
    const { slug, formData, phoneNumber, email } = req.body;

    if (!slug || !formData) {
      return new ServerError(res, 400, 'Slug and form data are required');
    }

    // Get landing page with campaign info
    const landingPage = await prisma.landingPage.findUnique({
      where: { slug },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!landingPage) {
      return new ServerError(res, 404, 'Form not found');
    }

    // Get IP and user agent from request
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || 
                      null;
    const userAgent = req.headers['user-agent'] || null;
    const referrer = Array.isArray(req.headers['referer']) 
      ? req.headers['referer'][0] 
      : (req.headers['referer'] || req.headers['referrer'] || null);

    // Create form submission
    const submission = await prisma.formSubmission.create({
      data: {
        landingPageId: landingPage.id,
        formData,
        phoneNumber,
        email,
        ipAddress,
        userAgent,
        referrer,
        workspaceId: landingPage.workspaceId,
      },
    });

    // Update landing page stats
    await prisma.landingPage.update({
      where: { id: landingPage.id },
      data: {
        submissions: {
          increment: 1,
        },
      },
    });

    // Try to create or link to a lead if phone number is provided
    if (phoneNumber) {
      try {
        // Get the first campaign associated with this landing page (if any)
        const campaign = landingPage.campaigns?.[0];

        // Check if lead exists
        const existingLead = await prisma.lead.findUnique({
          where: {
            phoneNumber_workspaceId: {
              phoneNumber,
              workspaceId: landingPage.workspaceId,
            },
          },
        });

        if (existingLead) {
          // Link submission to existing lead
          await prisma.formSubmission.update({
            where: { id: submission.id },
            data: { leadId: existingLead.id },
          });

          // Update lead status if it's NEW
          if (existingLead.status === 'NEW') {
            await prisma.lead.update({
              where: { id: existingLead.id },
              data: { status: 'INTERESTED' },
            });
          }

          // Update campaign lead count if lead is linked to this campaign
          if (campaign && !existingLead.campaignId) {
            await prisma.lead.update({
              where: { id: existingLead.id },
              data: { campaignId: campaign.id },
            });

            await prisma.leadCampaign.update({
              where: { id: campaign.id },
              data: {
                totalLeads: {
                  increment: 1,
                },
              },
            });
          }
        } else {
          // Create new lead from form submission
          const newLead = await prisma.lead.create({
            data: {
              businessName: formData.name || formData.businessName || 'Form Submission',
              phoneNumber,
              email: email || formData.email,
              source: 'FORM_SUBMISSION',
              status: 'INTERESTED',
              workspaceId: landingPage.workspaceId,
              campaignId: campaign?.id,
              customData: formData,
            },
          });

          // Link submission to new lead
          await prisma.formSubmission.update({
            where: { id: submission.id },
            data: { leadId: newLead.id },
          });

          // Update campaign lead count if campaign exists
          if (campaign) {
            await prisma.leadCampaign.update({
              where: { id: campaign.id },
              data: {
                totalLeads: {
                  increment: 1,
                },
              },
            });
          }
        }
      } catch (error) {
        console.error('Error creating/linking lead:', error);
        // Continue even if lead creation fails
      }
    }

    // Auto-create contact from form submission
    if (phoneNumber) {
      try {
        // Check if contact already exists with this phone number
        const existingContact = await prisma.contact.findFirst({
          where: {
            phone: phoneNumber,
            workspaceId: landingPage.workspaceId,
          },
        });

        if (!existingContact) {
          // Create new contact from form data
          const name = formData.name || formData.firstName || formData.businessName || '';
          const firstName = formData.firstName || name.split(' ')[0] || '';
          const lastName = formData.lastName || name.split(' ').slice(1).join(' ') || '';

          await prisma.contact.create({
            data: {
              phone: phoneNumber,
              email: email || formData.email,
              firstName,
              lastName,
              tag: 'form_submission',
              additionalInfo: JSON.stringify({
                source: 'form_submission',
                formName: landingPage.name,
                formData,
                submittedAt: new Date().toISOString(),
              }),
              workspaceId: landingPage.workspaceId,
            },
          });

          console.log('Created new contact from form submission:', phoneNumber);
        } else {
          console.log('Contact already exists for phone number:', phoneNumber);
        }
      } catch (contactError) {
        console.error('Error creating contact from form submission:', contactError);
        // Don't fail the form submission if contact creation fails
      }
    }

    return res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: landingPage.thankYouMessage,
      data: {
        submissionId: submission.id,
      },
    });
  } catch (error) {
    console.error('Error in submit-form:', error);
    return new ServerError(res, 500, 'Failed to submit form');
  }
}
