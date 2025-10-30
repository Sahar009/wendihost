declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    constructor(accessToken: string, apiVersion?: string);
    static init(accessToken: string, apiVersion?: string): FacebookAdsApi;
    setDebug(flag: boolean): void;
  }

  export class AbstractCrudObject {
    constructor(id?: string | number, data?: Record<string, any>, parentId?: string, api?: FacebookAdsApi);
    setData(data: Record<string, any>): void;
  }

  export class AdAccount extends AbstractCrudObject {
    constructor(id: string | number, data?: Record<string, any>, parentId?: string, api?: FacebookAdsApi);
    createCampaign(params: Record<string, any>): Promise<Campaign>;
    createAdSet(params: Record<string, any>): Promise<AdSet>;
    createAdImage(params: Record<string, any>): Promise<AdImage>;
    createAdCreative(params: Record<string, any>): Promise<AdCreative>;
    createAd(params: Record<string, any>): Promise<Ad>;
  }

  export class Campaign extends AbstractCrudObject {
    static Fields: {
      id: 'id';
      name: 'name';
      objective: 'objective';
      status: 'status';
    };
  }

  export class AdSet extends AbstractCrudObject {
    static Fields: {
      id: 'id';
      name: 'name';
      campaign_id: 'campaign_id';
      targeting: 'targeting';
      daily_budget: 'daily_budget';
      lifetime_budget: 'lifetime_budget';
      start_time: 'start_time';
      end_time: 'end_time';
      billing_event: 'billing_event';
      optimization_goal: 'optimization_goal';
      bid_amount: 'bid_amount';
      status: 'status';
    };
  }

  export class AdCreative extends AbstractCrudObject {
    static Fields: {
      id: 'id';
      name: 'name';
      object_story_spec: 'object_story_spec';
      link_url: 'link_url';
      message: 'message';
      call_to_action: 'call_to_action';
      object_type: 'object_type';
      status: 'status';
    };
  }

  export class Ad extends AbstractCrudObject {
    static Fields: {
      id: 'id';
      name: 'name';
      adset_id: 'adset_id';
      creative: 'creative';
      status: 'status';
    };
  }

  export class AdImage extends AbstractCrudObject {
    static Fields: {
      id: 'id';
      hash: 'hash';
      url: 'url';
    };
  }

  export const api: any;
  export const FacebookAdsApi: typeof FacebookAdsApi;
  export const AdAccount: typeof AdAccount;
  export const Campaign: typeof Campaign;
  export const AdSet: typeof AdSet;
  export const AdCreative: typeof AdCreative;
  export const Ad: typeof Ad;
  export const AdImage: typeof AdImage;
}
