import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { validateUserApi } from '@/services/session';
import { sessionCookie } from '@/services/session';

interface ScrapedBusiness {
  businessName: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUrl?: string;
  businessType?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return new ServerError(res, 405, 'Method not allowed');
  }

  try {
    const { businesses, workspaceId } = req.body;

    if (!businesses || !Array.isArray(businesses)) {
      return new ServerError(res, 400, 'Businesses array is required');
    }

    if (!workspaceId) {
      return new ServerError(res, 400, 'Workspace ID is required');
    }

    // Validate user
    const validatedInfo = await validateUserApi(req, Number(workspaceId));
    if (!validatedInfo) {
      return new ServerError(res, 401, 'Unauthorized');
    }

    const savedContacts = [];
    const skippedContacts = [];

    for (const business of businesses as ScrapedBusiness[]) {
      try {
        // Check if contact already exists by phone number
        let existingContact = null;
        if (business.phoneNumber) {
          existingContact = await prisma.contact.findFirst({
            where: {
              phone: business.phoneNumber,
              workspaceId: Number(workspaceId),
            },
          });
        }

        if (existingContact) {
          skippedContacts.push({
            businessName: business.businessName,
            phoneNumber: business.phoneNumber,
            reason: 'Phone number already exists',
          });
          continue;
        }

        // Create new contact
        const contact = await prisma.contact.create({
          data: {
            phone: business.phoneNumber || '',
            email: business.email || null,
            firstName: business.businessName.split(' ')[0] || '',
            lastName: business.businessName.split(' ').slice(1).join(' ') || '',
            tag: 'scraped_business',
            additionalInfo: JSON.stringify({
              source: 'google_places_scraper',
              businessType: business.businessType,
              address: business.address,
              website: business.website,
              rating: business.rating,
              reviewCount: business.reviewCount,
              googleMapsUrl: business.googleMapsUrl,
              scrapedAt: new Date().toISOString(),
            }),
            workspaceId: Number(workspaceId),
          },
        });

        savedContacts.push({
          id: contact.id,
          businessName: business.businessName,
          phoneNumber: business.phoneNumber,
        });

      } catch (error) {
        console.error('Error saving contact:', error);
        skippedContacts.push({
          businessName: business.businessName,
          phoneNumber: business.phoneNumber,
          reason: 'Error saving contact',
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: `Successfully saved ${savedContacts.length} contacts. Skipped ${skippedContacts.length}.`,
      data: {
        savedContacts,
        skippedContacts,
        totalProcessed: businesses.length,
        totalSaved: savedContacts.length,
        totalSkipped: skippedContacts.length,
      },
    });

  } catch (error) {
    console.error('Error in save-scraped-contacts:', error);
    return new ServerError(res, 500, 'Failed to save contacts');
  }
}

export default withIronSessionApiRoute(handler, sessionCookie());
