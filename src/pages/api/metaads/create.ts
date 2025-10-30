import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { FacebookAdsApi, AdAccount, Campaign, AdSet, AdCreative, Ad } from 'facebook-nodejs-business-sdk';

type AdType = 'facebook' | 'whatsapp';

interface CreateMetaAdRequest extends NextApiRequest {
  body: {
    adName: string;
    color: string;
    objective: string;
    targetAudience: string;
    budget: number | string;
    startDate: string;
    endDate: string;
    mediaUrl?: string;
    adText: string;
    cta: string;
    workspaceId: number | string;
    adType: AdType;
    phoneNumber?: string;
    pageId?: string;
    websiteUrl?: string;
  };
}

const OBJECTIVE_MAP: Record<string, string> = {
  'Traffic': 'LINK_CLICKS',
  'Engagement': 'POST_ENGAGEMENT',
  'Leads': 'LEAD_GENERATION',
  'Sales': 'CONVERSIONS',
  'Messages': 'MESSAGES',
  'Conversions': 'CONVERSIONS'
} as const;

const CTA_MAP: Record<string, string> = {
  'Learn More': 'LEARN_MORE',
  'Shop Now': 'SHOP_NOW',
  'Sign Up': 'SIGN_UP',
  'Contact Us': 'CONTACT_US',
  'Send WhatsApp Message': 'SEND_WHATSAPP_MESSAGE',
  'Get Help': 'GET_HELP'
} as const;

function initFacebookAPI(accessToken: string): void {
  const api = FacebookAdsApi.init(accessToken);
  if (process.env.NODE_ENV === 'development') {
    api.setDebug(true);
  }
}

interface AdCreationResult {
  success: boolean;
  adId?: string;
  campaignId?: string;
  adSetId?: string;
  creativeId?: string;
  error?: string;
}

const createFacebookAd = async (params: CreateMetaAdRequest['body'], accessToken: string, adAccountId: string): Promise<AdCreationResult> => {
  try {
    if (!params.pageId || !params.websiteUrl) {
      throw new Error('Missing required fields: pageId and websiteUrl are required for Facebook ads');
    }

    initFacebookAPI(accessToken);
    const adAccount = new AdAccount(adAccountId);
    
    // Create campaign
    const campaign = await adAccount.createCampaign([
      {
        name: `${params.adName} Campaign`,
        objective: OBJECTIVE_MAP[params.objective as keyof typeof OBJECTIVE_MAP] || 'LINK_CLICKS',
        status: 'PAUSED',
        special_ad_categories: [],
      },
    ]);

    const campaignId = (campaign as any)._data.id;

    interface FacebookApiResponse<T> {
      _data: T;
      id: string;
    }

    interface AdSetResponse {
      id: string;
    }

    const adSet = await adAccount.createAdSet([
      {
        name: `${params.adName} AdSet`,
        campaign_id: campaignId,
        status: 'PAUSED',
        optimization_goal: 'REACH',
        billing_event: 'IMPRESSIONS',
        bid_amount: Math.floor(Number(params.budget) * 100),
        daily_budget: Math.floor((Number(params.budget) / 30) * 100),
        targeting: {
          geo_locations: {
            countries: ['US'],
          },
          interests: [
            {
              id: '6003139266461',
              name: 'Parenting'
            }
          ]
        },
      },
    ]) as unknown as FacebookApiResponse<AdSetResponse>;

    const adSetId = adSet._data?.id || adSet.id;

    // Create creative
    const creative = await adAccount.createAdCreative([
      {
        name: `${params.adName} Creative`,
        object_story_spec: {
          page_id: params.pageId,
          link_data: {
            link: params.websiteUrl,
            message: params.adText,
            call_to_action: {
              type: CTA_MAP[params.cta as keyof typeof CTA_MAP] || 'LEARN_MORE',
            },
          },
        },
      },
    ]);

    const creativeId = (creative as any)._data.id;

    // Create ad
    const ad = await adAccount.createAd([
      {
        name: params.adName,
        adset_id: adSetId,
        creative: {
          creative_id: creativeId,
        },
        status: 'PAUSED',
      },
    ]);

    const adId = (ad as any)._data.id;

    return {
      success: true,
      adId,
      campaignId,
      adSetId,
      creativeId,
    };
  } catch (error: any) {
    console.error('Error creating Facebook ad:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Facebook ad',
    };
  }
}

const createWhatsAppAd = async (params: CreateMetaAdRequest['body'], accessToken: string, adAccountId: string): Promise<AdCreationResult> => {
  try {
    if (!params.phoneNumber) {
      throw new Error('Phone number is required for WhatsApp ads');
    }

    initFacebookAPI(accessToken);
    const adAccount = new AdAccount(adAccountId);

    // Create campaign
    const campaign = await adAccount.createCampaign([
      {
        name: `${params.adName} - WhatsApp`,
        objective: 'MESSAGES',
        status: 'PAUSED',
        special_ad_categories: [],
      },
    ]) as unknown as Campaign;

    const campaignId = (campaign as any)._data.id;

    // Create ad set
    const adSet = await adAccount.createAdSet([
      {
        name: `${params.adName} - WhatsApp AdSet`,
        campaign_id: campaignId,
        status: 'PAUSED',
        optimization_goal: 'REPLIES',
        billing_event: 'IMPRESSIONS',
        bid_amount: Math.floor(Number(params.budget) * 100),
        daily_budget: Math.floor((Number(params.budget) / 30) * 100),
        targeting: {
          geo_locations: {
            countries: ['US'],
          },
        },
      },
    ]) as unknown as AdSet;

    const adSetId = (adSet as any)._data.id;

    // Create creative for WhatsApp
    const creative = await adAccount.createAdCreative([
      {
        name: `${params.adName} - WhatsApp Creative`,
        object_story_spec: {
          page_id: params.pageId,
          instagram_actor_id: params.pageId,
          whatsapp_message_data: {
            type: 'MESSAGE_TEMPLATE',
            template: {
              name: 'hello_world',
              language: {
                code: 'en_US',
              },
            },
            to: params.phoneNumber,
          },
        },
      },
    ]) as unknown as AdCreative;

    const creativeId = (creative as any)._data.id;

    // Create ad
    const ad = await adAccount.createAd([
      {
        name: `${params.adName} - WhatsApp`,
        adset_id: adSetId,
        creative: {
          creative_id: creativeId,
        },
        status: 'PAUSED',
      },
    ]) as unknown as Ad;

    const adId = (ad as any)._data.id;

    return {
      success: true,
      adId,
      campaignId,
      adSetId,
      creativeId,
    };
  } catch (error: any) {
    console.error('Error creating WhatsApp ad:', error);
    return {
      success: false,
      error: error.message || 'Failed to create WhatsApp ad',
    };
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default withIronSessionApiRoute(
  async function createMetaAd(req: CreateMetaAdRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.body;
      
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { user, workspace } = validatedInfo;

      const requiredFields = [
        'adName',
        'objective',
        'targetAudience',
        'budget',
        'startDate',
        'endDate',
        'adText',
        'cta',
        'workspaceId',
        'adType',
      ] as const;

      const missingFields = requiredFields.filter(field => {
        const value = req.body[field as keyof typeof req.body];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        return new ServerError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
      }

      if (req.body.adType === 'facebook' && !req.body.pageId) {
        return new ServerError(res, 400, 'pageId is required for Facebook ads');
      }

      if (req.body.adType === 'whatsapp' && !req.body.phoneNumber) {
        return new ServerError(res, 400, 'phoneNumber is required for WhatsApp ads');
      }

      if (!workspace.accessToken || !workspace.fbUserId) {
        return new ServerError(res, 400, 'Please connect your Facebook account first');
      }

      const adAccountId = `act_${workspace.fbUserId}`;
      let result: AdCreationResult;

      if (req.body.adType === 'facebook') {
        result = await createFacebookAd(req.body, workspace.accessToken, adAccountId);
      } else {
        result = await createWhatsAppAd(req.body, workspace.accessToken, adAccountId);
      }

      if (!result.success) {
        return new ServerError(res, 500, result.error || 'Failed to create ad');
      }

      const metaAd = await prisma.metaAd.create({
        data: {
          adName: req.body.adName,
          adType: req.body.adType.toUpperCase() as 'FACEBOOK' | 'WHATSAPP',
          color: req.body.color,
          objective: req.body.objective,
          targetAudience: req.body.targetAudience,
          budget: Number(req.body.budget),
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
          mediaUrl: req.body.mediaUrl || null,
          adText: req.body.adText,
          cta: req.body.cta,
          phoneNumber: req.body.phoneNumber || null,
          userId: user.id,
          workspaceId: Number(req.body.workspaceId),
        },
      });

      return res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Ad created successfully',
        data: metaAd
      });
    } catch (error) {
      console.error('Error in metaads/create:', error);
      return new ServerError(res, 500, 'An unexpected error occurred');
    }
  },
  sessionCookie()
);