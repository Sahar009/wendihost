export interface MetaAd {
  id: number;
  name: string;
  status: string;
  reach: number;
  createdAt: string;
  adType: string;
  budget: number;
  startDate: string;
  endDate?: string;
  color?: string;
  objective?: string;
  targetAudience?: string;
  mediaUrl?: string;
  adText?: string;
  cta?: string;
  phoneNumber?: string;
  facebookAdId?: string;
  campaignId?: string;
  adSetId?: string;
  creativeId?: string;
  workspace?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  stats?: Array<{
    label: string;
    value: number;
  }>;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  spend?: number;
  frequency?: number;
  uniqueClicks?: number;
  inlineLinkClicks?: number;
  costPerInlineLinkClick?: number;
  costPerActionType?: Array<{
    action_type: string;
    value: string;
  }>;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  costPerResult?: number;
  results?: number;
  resultRate?: number;
  campaignName?: string;
  adsetName?: string;
  accountName?: string;
}
