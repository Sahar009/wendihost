import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import googlePlacesService from '@/services/leadgen/google-places';

interface ScrapeRequest extends NextApiRequest {
  body: {
    businessType: string;
    location: string;
    radius?: number;
    maxResults?: number;
    campaignId?: number;
  };
}

export default withIronSessionApiRoute(
  async function scrapePlaces(req: ScrapeRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;
      const { businessType, location, radius, maxResults, campaignId } = req.body;

      if (!businessType || !location) {
        return new ServerError(res, 400, 'Business type and location are required');
      }

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { user, workspace } = validatedInfo;

      // Check if Google Places API key is configured
      if (!process.env.GOOGLE_PLACES_API_KEY) {
        return new ServerError(
          res,
          500,
          'Google Places API is not configured. Please add GOOGLE_PLACES_API_KEY to your environment variables.'
        );
      }

      // Scrape places from Google
      const places = await googlePlacesService.searchPlaces({
        businessType,
        location,
        radius: radius || 5000,
        maxResults: maxResults || 50,
      });

      if (places.length === 0) {
        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'No businesses found matching your criteria',
          data: { leads: [], count: 0 },
        });
      }

      // Save leads to database
      const createdLeads = [];
      const skippedLeads = [];

      for (const place of places) {
        // Skip if no phone number
        if (!place.phoneNumber) {
          skippedLeads.push(place.businessName);
          continue;
        }

        try {
          // Check if lead already exists
          const existingLead = await prisma.lead.findUnique({
            where: {
              phoneNumber_workspaceId: {
                phoneNumber: place.phoneNumber,
                workspaceId: Number(workspaceId),
              },
            },
          });

          if (existingLead) {
            skippedLeads.push(place.businessName);
            continue;
          }

          // Create new lead
          const lead = await prisma.lead.create({
            data: {
              businessName: place.businessName,
              phoneNumber: place.phoneNumber,
              email: place.email,
              address: place.address,
              website: place.website,
              rating: place.rating,
              reviewCount: place.reviewCount,
              placeId: place.placeId,
              googleMapsUrl: place.googleMapsUrl,
              businessType: place.businessType || businessType,
              source: 'GOOGLE_PLACES',
              status: 'NEW',
              workspaceId: Number(workspaceId),
              campaignId: campaignId || null,
            },
          });

          createdLeads.push(lead);
        } catch (error) {
          console.error(`Error saving lead ${place.businessName}:`, error);
          skippedLeads.push(place.businessName);
        }
      }

      // Update campaign stats if campaignId provided
      if (campaignId) {
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
        message: `Successfully scraped ${createdLeads.length} leads`,
        data: {
          leads: createdLeads,
          count: createdLeads.length,
          skipped: skippedLeads.length,
          skippedReasons: skippedLeads.length > 0 ? 'Some leads were skipped (no phone number or already exists)' : null,
        },
      });
    } catch (error: any) {
      console.error('Error in scrape-places:', error);
      return new ServerError(res, 500, error.message || 'Failed to scrape places');
    }
  },
  sessionCookie()
);
