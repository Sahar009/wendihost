import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Get workspace with WhatsApp details
    const workspace = await prisma.workspace.findUnique({
      where: { id: Number(workspaceId) }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.phoneId || !workspace.accessToken) {
      return res.status(400).json({ error: 'WhatsApp not configured for this workspace' });
    }

    try {
      // Check WhatsApp Business account status
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${workspace.phoneId}`,
        {
          headers: {
            Authorization: `Bearer ${workspace.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const whatsappData = response.data;
      
      // Also check business account details
      let businessAccountData = null;
      if (whatsappData.business_account_id) {
        try {
          const businessResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${whatsappData.business_account_id}`,
            {
              headers: {
                Authorization: `Bearer ${workspace.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          businessAccountData = businessResponse.data;
        } catch (businessError: any) {
          console.log('Could not fetch business account details:', businessError.message);
        }
      }
      
      return res.json({
        success: true,
        message: 'WhatsApp Business account status retrieved',
        data: {
          phoneId: workspace.phoneId,
          businessAccountId: whatsappData.business_account_id,
          name: whatsappData.name,
          codeVerificationStatus: whatsappData.code_verification_status,
          qualityRating: whatsappData.quality_rating,
          isVerified: whatsappData.is_verified,
          status: whatsappData.status,
          // Additional fields that might be missing
          displayName: whatsappData.display_name,
          businessAccount: businessAccountData ? {
            id: businessAccountData.id,
            name: businessAccountData.name,
            verificationStatus: businessAccountData.verification_status,
            isBusinessVerified: businessAccountData.is_business_verified,
            businessType: businessAccountData.business_type,
            address: businessAccountData.address,
            website: businessAccountData.website
          } : null,
          // Raw data for debugging
          rawWhatsAppData: whatsappData
        }
      });

    } catch (whatsappError: any) {
      console.error('WhatsApp API error:', whatsappError.response?.data || whatsappError.message);
      
      return res.json({
        success: false,
        message: 'WhatsApp API error',
        error: whatsappError.response?.data || whatsappError.message,
        data: {
          phoneId: workspace.phoneId,
          hasAccessToken: !!workspace.accessToken,
          errorCode: whatsappError.response?.status,
          errorType: whatsappError.response?.data?.error?.type
        }
      });
    }

  } catch (error) {
    console.error('WhatsApp status check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
