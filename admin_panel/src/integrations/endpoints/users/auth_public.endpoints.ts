// =============================================================
// FILE: src/integrations/endpoints/auth_public.endpoints.ts
// FINAL — Public Auth RTK endpoints (tokenStore sync)
// - /auth/* endpoints
// - tokenStore set/clear on login/signup/refresh/logout
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import { tokenStore } from '@/integrations/core/token';

import type {
  AuthTokenResponse,
  AuthStatusResponse,
  AuthMeResponse,
  PasswordResetRequestResponse,
  PasswordResetConfirmResponse,
  AuthTokenRefreshResponse,
  AuthSignupBody,
  AuthTokenBody,
  AuthUpdateBody,
  PasswordResetRequestBody,
  PasswordResetConfirmBody,
} from '@/integrations/shared';

const setAccessTokenSafely = (token?: string | null) => {
  try {
    tokenStore.set(token);
  } catch {
    // localStorage kapalı olabilir; sessiz geç
  }
};

export const authPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** POST /auth/signup */
    authSignup: build.mutation<AuthTokenResponse, AuthSignupBody>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
      invalidatesTags: ['User', 'Auth'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAccessTokenSafely(data?.access_token);
        } catch {
          setAccessTokenSafely('');
        }
      },
    }),

    /** POST /auth/token */
    authToken: build.mutation<AuthTokenResponse, AuthTokenBody>({
      query: (body) => ({
        url: '/auth/token',
        method: 'POST',
        body: {
          ...body,
          grant_type: body?.grant_type ?? 'password',
        },
      }),
      invalidatesTags: ['User', 'Auth'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAccessTokenSafely(data?.access_token);
        } catch {
          setAccessTokenSafely('');
        }
      },
    }),

    /** POST /auth/token/refresh */
    authRefresh: build.mutation<AuthTokenRefreshResponse, void>({
      query: () => ({ url: '/auth/token/refresh', method: 'POST' }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAccessTokenSafely(data?.access_token);
        } catch {
          setAccessTokenSafely('');
        }
      },
    }),

    /** GET /auth/user */
    authMe: build.query<AuthMeResponse, void>({
      query: () => ({ url: '/auth/user', method: 'GET' }),
      providesTags: ['User', 'Auth'],
    }),

    /** GET /auth/status */
    authStatus: build.query<AuthStatusResponse, void>({
      query: () => ({ url: '/auth/status', method: 'GET' }),
      providesTags: ['User', 'Auth'],
    }),

    /** PUT /auth/user */
    authUpdate: build.mutation<AuthMeResponse, AuthUpdateBody>({
      query: (body) => ({ url: '/auth/user', method: 'PUT', body }),
      invalidatesTags: ['User', 'Auth'],
    }),

    /** POST /auth/password-reset/request */
    authPasswordResetRequest: build.mutation<
      PasswordResetRequestResponse,
      PasswordResetRequestBody
    >({
      query: (body) => ({ url: '/auth/password-reset/request', method: 'POST', body }),
    }),

    /** POST /auth/password-reset/confirm */
    authPasswordResetConfirm: build.mutation<
      PasswordResetConfirmResponse,
      PasswordResetConfirmBody
    >({
      query: (body) => ({ url: '/auth/password-reset/confirm', method: 'POST', body }),
      invalidatesTags: ['User', 'Auth'],
    }),

    /** POST /auth/logout */
    authLogout: build.mutation<{ ok: true }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: ['User', 'Auth', 'AdminUsers', 'UserRoles'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          setAccessTokenSafely('');
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useAuthSignupMutation,
  useAuthTokenMutation,
  useAuthRefreshMutation,
  useAuthMeQuery,
  useAuthStatusQuery,
  useAuthUpdateMutation,
  useAuthPasswordResetRequestMutation,
  useAuthPasswordResetConfirmMutation,
  useAuthLogoutMutation,
} = authPublicApi;

// Kısa alias
export const useLoginMutation = useAuthTokenMutation;
export const useSignupMutation = useAuthSignupMutation;
export const useAuthRegisterMutation = useAuthSignupMutation;
export const useStatusQuery = useAuthStatusQuery;
export const useLogoutMutation = useAuthLogoutMutation;
