// ===================================================================
// FILE: src/integrations/endpoints/notifications.endpoints.ts
// FINAL — Notifications RTK (Auth-required, shared for admin+user)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  NotificationView,
  NotificationsListParams,
  UnreadCountResp,
  CreateNotificationBody,
  UpdateNotificationBody,
  MarkAllReadBody,
  OkResp,
  PushCampaignSendResult,
  PushCampaignView,
} from '@/integrations/shared';
import {
  normalizeNotification,
  normalizeNotificationsList,
  normalizePushCampaignsList,
  toNotificationsListQuery,
  toCreateNotificationBody,
  toUpdateNotificationBody,
} from '@/integrations/shared';

const BASE = '/notifications';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /notifications */
    listNotifications: b.query<NotificationView[], NotificationsListParams | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ? toNotificationsListQuery(params) : undefined,
      }),
      transformResponse: (res: unknown): NotificationView[] => normalizeNotificationsList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((n) => ({ type: 'Notification' as const, id: n.id })),
              { type: 'Notifications' as const, id: 'LIST' },
            ]
          : [{ type: 'Notifications' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    /** GET /notifications/unread-count */
    getUnreadCount: b.query<UnreadCountResp, void>({
      query: () => ({ url: `${BASE}/unread-count`, method: 'GET' }),
      transformResponse: (res: unknown): UnreadCountResp => {
        const r = (res ?? {}) as any;
        const n = Number(r.count ?? 0);
        return { count: Number.isFinite(n) ? n : 0 };
      },
      providesTags: [{ type: 'Notifications' as const, id: 'UNREAD_COUNT' }],
      keepUnusedDataFor: 10,
    }),

    /** POST /notifications */
    createNotification: b.mutation<NotificationView, CreateNotificationBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toCreateNotificationBody(body),
      }),
      transformResponse: (res: unknown): NotificationView => normalizeNotification(res),
      invalidatesTags: [
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),

    /** PATCH /notifications/:id */
    updateNotification: b.mutation<NotificationView, { id: string; body: UpdateNotificationBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toUpdateNotificationBody(body),
      }),
      transformResponse: (res: unknown): NotificationView => normalizeNotification(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Notification' as const, id: arg.id },
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),

    /** POST /notifications/mark-all-read */
    markAllRead: b.mutation<OkResp, MarkAllReadBody | void>({
      query: (body) => ({
        url: `${BASE}/mark-all-read`,
        method: 'POST',
        body: body ?? {}, // backend accepts empty object
      }),
      transformResponse: (res: unknown): OkResp => {
        const r = (res ?? {}) as any;
        if (r && (r.ok === true || r.ok === 1 || r.ok === '1')) return { ok: true as const };
        return { ok: true as const };
      },
      invalidatesTags: [
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),

    /** DELETE /notifications/:id */
    deleteNotification: b.mutation<OkResp, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): OkResp => {
        const r = (res ?? {}) as any;
        if (r && (r.ok === true || r.ok === 1 || r.ok === '1')) return { ok: true as const };
        return { ok: true as const };
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Notification' as const, id: arg.id },
        { type: 'Notifications' as const, id: 'LIST' },
        { type: 'Notifications' as const, id: 'UNREAD_COUNT' },
      ],
    }),

    /** POST /admin/push/send */
    sendManualPush: b.mutation<any, { title: string; body: string; user_id?: string; target_all?: boolean }>({
      query: (body) => ({
        url: '/admin/push/send',
        method: 'POST',
        body,
      }),
    }),

    /** GET /admin/push/campaigns */
    listPushCampaigns: b.query<PushCampaignView[], void>({
      query: () => ({ url: '/admin/push/campaigns', method: 'GET' }),
      transformResponse: (res: unknown): PushCampaignView[] => normalizePushCampaignsList(res),
      keepUnusedDataFor: 60,
    }),

    /** POST /admin/push/campaigns/:slug/send */
    sendPushCampaign: b.mutation<PushCampaignSendResult, string>({
      query: (slug) => ({
        url: `/admin/push/campaigns/${encodeURIComponent(slug)}/send`,
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useSendManualPushMutation,
  useListPushCampaignsQuery,
  useSendPushCampaignMutation,
} = notificationsApi;

// Legacy/admin-panel aliases
export const useGetUnreadNotificationCountQuery = useGetUnreadCountQuery;
export const useGetUnreadNotificationsCountQuery = useGetUnreadCountQuery;
export const usePatchNotificationMutation = useUpdateNotificationMutation;
export const useMarkAllNotificationsReadMutation = useMarkAllReadMutation;
