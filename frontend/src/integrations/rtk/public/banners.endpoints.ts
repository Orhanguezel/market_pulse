import { baseApi } from '../baseApi';
import type { Banner, BannerPlacement } from '@/types/common';

const bannersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBanners: build.query<Banner[], { placement?: BannerPlacement; locale?: string }>({
      query: (params) => ({ url: '/banners', params }),
      transformResponse: (res: any) => res.data || res,
    }),
    trackBannerClick: build.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/banners/${id}/click`,
        method: 'POST',
      }),
    }),
  }),
});

export const { useListBannersQuery, useTrackBannerClickMutation } = bannersApi;
