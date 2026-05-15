// frontend/src/integrations/rtk/public/geocode.endpoints.ts

import { baseApi } from '../baseApi';
import type { GeocodeResult } from '@/types/common';

export const geocodeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchGeocode: build.query<GeocodeResult, string>({
      query: (q) => `/geocode?q=${encodeURIComponent(q)}`,
      transformResponse: (res: { data: GeocodeResult }) => res.data,
    }),
  }),
});

export const { useLazySearchGeocodeQuery, useSearchGeocodeQuery } = geocodeApi;
