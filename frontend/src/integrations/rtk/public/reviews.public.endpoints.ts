// =============================================================
// FILE: src/integrations/rtk/endpoints/reviews.public.endpoints.ts
// Public Reviews RTK Query endpoints
// =============================================================
import { baseApi } from '@/integrations/rtk/baseApi';

import type {
  ReviewDto,
  ReviewListQueryParams,
  ReviewCreatePayload,
  ReviewReactionPayload,
} from '@/integrations/shared';

export const reviewsPublicEndpoints = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /reviews
    listReviewsPublic: build.query<ReviewDto[], ReviewListQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> | undefined = params
          ? (params as Record<string, any>)
          : undefined;

        return {
          url: '/reviews',
          method: 'GET',
          params: queryParams,
        };
      },
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: 'Review' as const, id: r.id })),
              { type: 'Review' as const, id: 'LIST' },
            ]
          : [{ type: 'Review' as const, id: 'LIST' }],
    }),

    // GET /reviews/:id
    getReviewPublic: build.query<ReviewDto, string>({
      query: (id) => ({
        url: `/reviews/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: (_res, _err, id) => [{ type: 'Review' as const, id }],
    }),

    // POST /reviews
    createReviewPublic: build.mutation<ReviewDto, ReviewCreatePayload>({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Review' as const, id: 'LIST' }],
    }),

    // POST /reviews/:id/reactions  (like/helpful)
    addReviewReactionPublic: build.mutation<
      ReviewDto,
      { id: string; body?: ReviewReactionPayload }
    >({
      query: ({ id, body }) => ({
        url: `/reviews/${encodeURIComponent(id)}/reactions`,
        method: 'POST',
        body: body ?? { type: 'like' },
      }),
      // Tek review ve listeyi invalid et
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Review' as const, id },
        { type: 'Review' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListReviewsPublicQuery,
  useGetReviewPublicQuery,
  useCreateReviewPublicMutation,
  useAddReviewReactionPublicMutation,
} = reviewsPublicEndpoints;
