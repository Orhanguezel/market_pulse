// =============================================================
// FILE: src/integrations/rtk/endpoints/auth.endpoints.ts
// public auth RTK endpoints (Next.js uyumlu)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import type {
  LoginBody,
  SignUpBody,
  TokenResp,
  UserResp,
  StatusResp,
  UpdateUserBody,
  PasswordResetRequestBody,
  PasswordResetRequestResp,
  PasswordResetConfirmBody,
  PasswordResetConfirmResp,
  EmailVerificationResp,
  EmailVerificationConfirmBody,
} from '@/integrations/shared';

const BASE = '/auth';

/* -----------------------------
 * Public/Auth Endpoints
 * ----------------------------- */

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /auth/token  (password grant) */
    token: b.mutation<TokenResp, { email: string; password: string }>({
      query: ({ email, password }): FetchArgs => ({
        url: `${BASE}/token`,
        method: 'POST',
        body: {
          grant_type: 'password',
          email,
          password,
        } satisfies LoginBody,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/signup */
    signUp: b.mutation<TokenResp, SignUpBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/signup`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/token/refresh */
    refresh: b.mutation<{ access_token: string; token_type: 'bearer' }, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/token/refresh`,
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    /** GET /auth/user (me) */
    me: b.query<UserResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/user`,
        method: 'GET',
      }),
      providesTags: ['Auth', 'User'],
    }),

    /** GET /auth/status */
    status: b.query<StatusResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/status`,
        method: 'GET',
      }),
      providesTags: ['Auth', 'User'],
    }),

    /** POST /auth/logout */
    logout: b.mutation<void, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/logout`,
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/google  (ID token ile sign in) */
    signInWithGoogle: b.mutation<TokenResp, { idToken: string }>({
      query: ({ idToken }): FetchArgs => ({
        url: `${BASE}/google`,
        method: 'POST',
        body: { id_token: idToken },
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/google/start (redirect url üretimi) */
    googleStart: b.mutation<{ url: string }, { redirectTo?: string }>({
      query: ({ redirectTo }): FetchArgs => ({
        url: `${BASE}/google/start`,
        method: 'POST',
        body: { redirectTo },
      }),
    }),

    /** POST /auth/social-login (Google ID token VEYA Facebook access_token) */
    socialLogin: b.mutation<
      TokenResp & { user?: any },
      | { type: 'google'; id_token?: string; access_token?: string; email?: string }
      | { type: 'facebook'; access_token?: string; email?: string }
      | {
          type: 'apple';
          identity_token: string;
          authorization_code?: string;
          apple_user_name?: string;
          email?: string;
        }
    >({
      query: (body): FetchArgs => ({
        url: `${BASE}/social-login`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** PUT /auth/user  (şu an sadece email + password) */
    updateUser: b.mutation<UserResp, UpdateUserBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/user`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    /** POST /auth/password-reset/request  (şifremi unuttum) */
    requestPasswordReset: b.mutation<PasswordResetRequestResp, PasswordResetRequestBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/request`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/password-reset/confirm  (yeni şifre kaydet) */
    confirmPasswordReset: b.mutation<PasswordResetConfirmResp, PasswordResetConfirmBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    /** POST /auth/email-verification/send  (doğrulama e-postası gönder) */
    sendEmailVerification: b.mutation<EmailVerificationResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/email-verification/send`,
        method: 'POST',
      }),
    }),

    /** POST /auth/email-verification/confirm  (e-posta doğrula) */
    confirmEmailVerification: b.mutation<EmailVerificationResp, EmailVerificationConfirmBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/email-verification/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useTokenMutation,
  useSignUpMutation,
  useRefreshMutation,
  useMeQuery,
  useStatusQuery,
  useLazyStatusQuery,
  useLogoutMutation,
  useSignInWithGoogleMutation,
  useGoogleStartMutation,
  useSocialLoginMutation,
  useUpdateUserMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useSendEmailVerificationMutation,
  useConfirmEmailVerificationMutation,
} = authApi;

// Kısa alias'lar
export const useLoginMutation = useTokenMutation;
export const useSignupMutation = useSignUpMutation;
export const useGetSessionQuery = useMeQuery;
export const useOauthStartMutation = useGoogleStartMutation;
