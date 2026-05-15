import { baseApi } from '../baseApi';

export interface Campaign {
  id: string;
  code: string;
  type: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial_days';
  value: string | number;
  applies_to: string;
  name_tr?: string;
  name_en?: string;
  description_tr?: string;
  description_en?: string;
}

export interface RedeemResponse {
  campaign: Partial<Campaign>;
  redemption_id: string;
  value_applied: number;
}

const campaignsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listActiveCampaigns: build.query<Campaign[], { applies_to?: string }>({
      query: (params) => ({ url: '/campaigns/active', params }),
      transformResponse: (res: { data: Campaign[] }) => res.data,
    }),
    redeemCampaign: build.mutation<RedeemResponse, { code: string; applies_to?: string; order_id?: string }>({
      query: (body) => ({
        url: '/campaigns/redeem',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: RedeemResponse }) => res.data,
    }),
  }),
});

export const { useListActiveCampaignsQuery, useRedeemCampaignMutation } = campaignsApi;
