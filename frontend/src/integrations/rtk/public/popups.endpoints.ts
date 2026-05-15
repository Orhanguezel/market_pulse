import { baseApi } from '@/integrations/rtk/baseApi';
import type { ApiPopupPublic, PopupPublicDto, PopupPublicQueryParams } from '@/integrations/shared';
import { cleanParams, normalizePopupPublic } from '@/integrations/shared';

export const popupsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPopupsPublic: build.query<PopupPublicDto[], PopupPublicQueryParams | void>({
      query: (params) => ({
        url: '/popups',
        method: 'GET',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      transformResponse: (response: ApiPopupPublic[]) =>
        Array.isArray(response) ? response.map(normalizePopupPublic) : [],
    }),
  }),
  overrideExisting: false,
});

export const { useListPopupsPublicQuery } = popupsPublicApi;
