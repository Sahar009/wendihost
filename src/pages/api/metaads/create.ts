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
    budgetType?: 'daily' | 'monthly';
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

// Parse target audience string to extract country codes
const parseTargetAudience = (targetAudience: string): string[] => {
  if (!targetAudience || !targetAudience.trim()) {
    return ['NG']; 
  }
  
  // Split by comma and clean up
  const countries = targetAudience
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length === 2); // Only valid 2-letter codes
  
  return countries.length > 0 ? countries : ['US'];
};

// Convert NGN to USD cents (approximate rate: 1 USD = 1500 NGN)
// This is a rough conversion - in production, use a real-time exchange rate API
const convertBudgetToUSDCents = (budgetNGN: number, budgetType: 'daily' | 'monthly' = 'daily'): number => {
  const USD_TO_NGN = 1500; // Approximate exchange rate
  const budgetUSD = budgetNGN / USD_TO_NGN;
  
  // Facebook API expects budget in cents
  // If monthly, divide by 30 to get daily budget
  const dailyBudgetUSD = budgetType === 'monthly' ? budgetUSD / 30 : budgetUSD;
  
  return Math.floor(dailyBudgetUSD * 100); // Convert to cents
};

const createFacebookAd = async (params: CreateMetaAdRequest['body'], accessToken: string, adAccountId: string): Promise<AdCreationResult> => {
  try {
    if (!params.pageId || !params.websiteUrl) {
      throw new Error('Missing required fields: pageId and websiteUrl are required for Facebook ads');
    }

    initFacebookAPI(accessToken);
    const adAccount = new AdAccount(adAccountId);
    
    // Parse dates for scheduling
    const startTime = params.startDate ? new Date(params.startDate).getTime() / 1000 : undefined;
    const endTime = params.endDate ? new Date(params.endDate).getTime() / 1000 : undefined;
    
    // Determine ad set status based on dates
    const now = Math.floor(Date.now() / 1000);
    let adSetStatus = 'PAUSED';
    if (startTime && startTime <= now && (!endTime || endTime > now)) {
      adSetStatus = 'ACTIVE';
    }
    
    // Create campaign
    const campaign = await adAccount.createCampaign([
      {
        name: `${params.adName} Campaign`,
        objective: OBJECTIVE_MAP[params.objective as keyof typeof OBJECTIVE_MAP] || 'LINK_CLICKS',
        status: 'PAUSED', // Campaign stays paused, ad set controls active status
        special_ad_categories: [],
      },
    ]);

    const campaignId = (campaign as any)._data.id;

    // Parse target audience to get country codes
    const countries = parseTargetAudience(params.targetAudience);
    
    // Convert budget to USD cents
    const dailyBudgetCents = convertBudgetToUSDCents(Number(params.budget), params.budgetType || 'daily');

    interface FacebookApiResponse<T> {
      _data: T;
      id: string;
    }

    interface AdSetResponse {
      id: string;
    }

    const adSetData: any = {
      name: `${params.adName} AdSet`,
      campaign_id: campaignId,
      status: adSetStatus,
      optimization_goal: 'REACH',
      billing_event: 'IMPRESSIONS',
      daily_budget: dailyBudgetCents,
      targeting: {
        geo_locations: {
          countries: countries,
        },
      },
    };

    // Add scheduling if dates are provided
    if (startTime) {
      adSetData.start_time = startTime;
    }
    if (endTime) {
      adSetData.end_time = endTime;
    }

    const adSet = await adAccount.createAdSet([adSetData]) as unknown as FacebookApiResponse<AdSetResponse>;

    const adSetId = adSet._data?.id || adSet.id;

    // Create creative
    const creativeData: any = {
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
    };

    // Add image if provided
    if (params.mediaUrl) {
      creativeData.object_story_spec.link_data.image_url = params.mediaUrl;
    }

    const creative = await adAccount.createAdCreative([creativeData]);

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
    
    if (!params.pageId) {
      throw new Error('Page ID is required for WhatsApp ads');
    }

    initFacebookAPI(accessToken);
    const adAccount = new AdAccount(adAccountId);

    // Parse dates for scheduling
    const startTime = params.startDate ? new Date(params.startDate).getTime() / 1000 : undefined;
    const endTime = params.endDate ? new Date(params.endDate).getTime() / 1000 : undefined;
    
    // Determine ad set status based on dates
    const now = Math.floor(Date.now() / 1000);
    let adSetStatus = 'PAUSED';
    if (startTime && startTime <= now && (!endTime || endTime > now)) {
      adSetStatus = 'ACTIVE';
    }

    // Create campaign
    const campaign = await adAccount.createCampaign([
      {
        name: `${params.adName} - WhatsApp`,
        objective: 'MESSAGES',
        status: 'PAUSED', // Campaign stays paused, ad set controls active status
        special_ad_categories: [],
      },
    ]) as unknown as Campaign;

    const campaignId = (campaign as any)._data.id;

    // Parse target audience to get country codes
    const countries = parseTargetAudience(params.targetAudience);
    
    // Convert budget to USD cents
    const dailyBudgetCents = convertBudgetToUSDCents(Number(params.budget), params.budgetType || 'daily');

    // Create ad set
    const adSetData: any = {
      name: `${params.adName} - WhatsApp AdSet`,
      campaign_id: campaignId,
      status: adSetStatus,
      optimization_goal: 'REPLIES',
      billing_event: 'IMPRESSIONS',
      daily_budget: dailyBudgetCents,
      targeting: {
        geo_locations: {
          countries: countries,
        },
      },
    };

    // Add scheduling if dates are provided
    if (startTime) {
      adSetData.start_time = startTime;
    }
    if (endTime) {
      adSetData.end_time = endTime;
    }

    const adSet = await adAccount.createAdSet([adSetData]) as unknown as AdSet;

    const adSetId = (adSet as any)._data.id;

    // Create creative for WhatsApp using adText
    // Note: WhatsApp ads require templates, but we can use a text message format
    // For production, you should create and use approved WhatsApp templates
    const creative = await adAccount.createAdCreative([
      {
        name: `${params.adName} - WhatsApp Creative`,
        object_story_spec: {
          page_id: params.pageId,
          instagram_actor_id: params.pageId,
          link_data: {
            link: `https://wa.me/${params.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(params.adText || 'Hello')}`,
            message: params.adText || 'Click to send a WhatsApp message',
            call_to_action: {
              type: 'SEND_MESSAGE',
            },
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

      if (req.body.adType === 'whatsapp') {
        if (!req.body.phoneNumber) {
          return new ServerError(res, 400, 'phoneNumber is required for WhatsApp ads');
        }
        if (!req.body.pageId) {
          return new ServerError(res, 400, 'pageId is required for WhatsApp ads');
        }
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
          facebookAdId: result.adId || null,
          campaignId: result.campaignId || null,
          adSetId: result.adSetId || null,
          creativeId: result.creativeId || null,
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