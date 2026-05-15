// =============================================================
// FILE: src/integrations/types/review_admin.types.ts
// Admin Reviews
// =============================================================

import type {
  ReviewDto,
  ReviewListQueryParams,
  ReviewCreatePayload,
  ReviewUpdatePayload,
} from '@/integrations/shared';

export type AdminReviewDto = ReviewDto;

export type AdminReviewListQueryParams = ReviewListQueryParams;

export type AdminReviewListResponse = {
  items: AdminReviewDto[];
  total: number;
};

export type AdminGetReviewParams = {
  id: string;
};

export type AdminReviewCreatePayload = ReviewCreatePayload;
export type AdminReviewUpdatePayload = ReviewUpdatePayload;
