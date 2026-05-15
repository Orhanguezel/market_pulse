// =============================================================
// FILE: src/integrations/rtk/endpoints/notifications.endpoints.ts
// – Notifications RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  NotificationDto,
  NotificationListQueryParams,
  NotificationCreatePayload,
  NotificationUpdatePayload,
  NotificationDeletePayload,
  NotificationUnreadCountResponse,
} from '@/integrations/shared';
import { normalizeNotification } from '@/integrations/shared';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /notifications
     * Aktif kullanıcının bildirim listesi
     */
    listNotifications: build.query<NotificationDto[], NotificationListQueryParams | void>({
      query: (params) => {
        const p: Record<string, any> = { ...(params || {}) };

        // boolean is_read geldiyse string'e çevir (backend her ikisini de kabul ediyor)
        if (typeof p.is_read === 'boolean') {
          p.is_read = p.is_read ? 'true' : 'false';
        }

        return {
          url: '/notifications',
          method: 'GET',
          params: p,
        };
      },
      transformResponse: (data: unknown): NotificationDto[] => {
        if (!Array.isArray(data)) return [];
        return data.map((n) => normalizeNotification(n));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({
                type: 'Notification' as const,
                id: n.id,
              })),
              { type: 'Notification' as const, id: 'LIST' },
            ]
          : [{ type: 'Notification' as const, id: 'LIST' }],
    }),

    /**
     * GET /notifications/unread-count
     */
    getUnreadNotificationsCount: build.query<NotificationUnreadCountResponse, void>({
      query: () => ({
        url: '/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: [{ type: 'Notification', id: 'UNREAD_COUNT' }],
    }),

    /**
     * POST /notifications
     * Manuel bildirim oluşturma (örn. admin panelden)
     */
    createNotification: build.mutation<NotificationDto, NotificationCreatePayload>({
      query: (body) => ({
        url: '/notifications',
        method: 'POST',
        body,
      }),
      transformResponse: (data: unknown): NotificationDto => normalizeNotification(data),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * PATCH /notifications/:id
     * Okundu / okunmadı
     */
    markNotificationRead: build.mutation<NotificationDto, NotificationUpdatePayload>({
      query: ({ id, ...patch }) => ({
        url: `/notifications/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (data: unknown): NotificationDto => normalizeNotification(data),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * POST /notifications/mark-all-read
     */
    markAllNotificationsRead: build.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
        body: {}, // schema boş object bekliyor
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * DELETE /notifications/:id
     */
    deleteNotification: build.mutation<{ ok: boolean }, NotificationDeletePayload>({
      query: ({ id }) => ({
        url: `/notifications/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNotificationsQuery,
  useGetUnreadNotificationsCountQuery,
  useCreateNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
