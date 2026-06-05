import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { hash as argonHash } from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { handleRouteError } from '../_shared';
import { getGoogleSettings } from '../siteSettings';
import { getPrimaryRole } from '../userRoles';
import { sendWelcomeMail, sendPasswordChangedMail } from '../mail';
import { telegramNotify } from '../telegram';
import {
  signupBody,
  tokenBody,
  googleBody,
  updateBody,
  passwordResetRequestBody,
  passwordResetConfirmBody,
} from './validation';
import {
  repoGetUserByEmail,
  repoGetUserById,
  repoCreateUser,
  repoUpdateUserEmail,
  repoUpdateUserPassword,
  repoUpdateLastSignIn,
  repoSyncGoogleUser,
  repoAssignRole,
  repoEnsureProfileRow,
  repoGetRefreshToken,
  repoRevokeRefreshToken,
  repoRevokeAllUserRefreshTokens,
  repoRotateRefreshToken,
  repoCreatePasswordChangedNotification,
} from './repository';
import {
  type Role,
  type JWTPayload,
  getJWTFromReq,
  bearerFrom,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  issueTokens,
  verifyPasswordSmart,
  parseAdminEmailAllowlist,
  ACCESS_MAX_AGE,
} from './helpers';

const adminEmails = parseAdminEmailAllowlist();
let googleClient: OAuth2Client | null = null;

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client();
  }
  return googleClient;
}

function rejectNonAdmin(role: Role, reply: FastifyReply) {
  if (role === 'admin') return false;
  reply.status(403).send({ error: { message: 'admin_only' } });
  return true;
}

async function verifyGoogleIdentityToken(idToken: string) {
  const { clientId } = await getGoogleSettings();
  if (!clientId) {
    return { ok: false as const, code: 'google_oauth_not_configured' };
  }

  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return { ok: false as const, code: 'google_email_missing' };
    }

    if (!payload.email_verified) {
      return { ok: false as const, code: 'google_email_not_verified' };
    }

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, code: 'invalid_google_token' };
  }
}

/** POST /auth/signup */
export async function signup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = signupBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

    const { email, password } = parsed.data;
    const meta = (parsed.data.options?.data ?? {}) as Record<string, unknown>;
    const full_name = (parsed.data.full_name ?? (typeof meta['full_name'] === 'string' ? meta['full_name'] : undefined)) || undefined;
    const phone = (parsed.data.phone ?? (typeof meta['phone'] === 'string' ? meta['phone'] : undefined)) || undefined;
    const requestedRole = meta['role'] === 'editor' ? 'editor' : 'customer';
    const rulesAccepted = parsed.data.rules_accepted === true;

    const exists = await repoGetUserByEmail(email);
    if (exists) return reply.status(409).send({ error: { message: 'user_exists' } });

    const id = randomUUID();
    const password_hash = await argonHash(password);
    await repoCreateUser({ id, email, password_hash, full_name, phone, rules_accepted_at: rulesAccepted ? new Date() : undefined });

    const isAdmin = adminEmails.has(email.toLowerCase());
    const assignedRole: Role = isAdmin ? 'admin' : requestedRole;
    await repoAssignRole(id, assignedRole);
    await repoEnsureProfileRow(id, { full_name: full_name ?? null, phone: phone ?? null });

    void sendWelcomeMail({ to: email, user_name: full_name || email.split('@')[0], user_email: email }).catch((err) => req.log?.error?.(err, 'welcome_mail_failed'));
    void telegramNotify({ event: 'new_user', data: { user_name: full_name || email.split('@')[0], user_email: email, role: assignedRole, created_at: new Date().toISOString() } });

    const u = await repoGetUserById(id);
    if (rejectNonAdmin(assignedRole, reply)) return;
    const { access, refresh } = await issueTokens(req.server, u!, assignedRole);
    setAccessCookie(reply, access);
    setRefreshCookie(reply, refresh);

    return reply.send({
      access_token: access,
      token_type: 'bearer',
      user: {
        id,
        email,
        full_name: full_name ?? null,
        phone: phone ?? null,
        email_verified: 0,
        is_active: 1,
        ecosystem_id: u?.ecosystem_id ?? null,
        role: assignedRole,
      },
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_signup');
  }
}

/** POST /auth/token */
export async function token(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = tokenBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

    const u = await repoGetUserByEmail(parsed.data.email);
    if (!u || !(await verifyPasswordSmart(u.password_hash, parsed.data.password))) {
      return reply.status(401).send({ error: { message: 'invalid_credentials' } });
    }

    await repoUpdateLastSignIn(u.id);
    await repoEnsureProfileRow(u.id);
    const role = await getPrimaryRole(u.id);
    if (rejectNonAdmin(role, reply)) return;
    const { access, refresh } = await issueTokens(req.server, u, role);
    setAccessCookie(reply, access);
    setRefreshCookie(reply, refresh);

    return reply.send({
      access_token: access,
      token_type: 'bearer',
      user: {
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        phone: u.phone ?? null,
        email_verified: u.email_verified,
        is_active: u.is_active,
        ecosystem_id: u.ecosystem_id ?? null,
        role,
      },
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_token');
  }
}

/** GET /auth/google/config */
export async function googleConfig(_req: FastifyRequest, reply: FastifyReply) {
  const { clientId } = await getGoogleSettings();
  return reply.send({
    enabled: Boolean(clientId),
    client_id: clientId,
  });
}

/** POST /auth/google */
export async function googleToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = googleBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

    const verified = await verifyGoogleIdentityToken(parsed.data.id_token);
    if (!verified.ok) {
      const status = verified.code === 'google_oauth_not_configured' ? 503 : 401;
      return reply.status(status).send({ error: { message: verified.code } });
    }

    const email = (verified.payload.email ?? "").toLowerCase();
    const full_name = verified.payload.name?.trim() || undefined;
    const avatar_url =
      typeof verified.payload.picture === 'string'
        ? verified.payload.picture.trim() || undefined
        : undefined;
    let user = await repoGetUserByEmail(email);

    if (!user) {
      const id = randomUUID();
      const password_hash = await argonHash(randomUUID());
      const role: Role = adminEmails.has(email) ? 'admin' : 'customer';

      await repoCreateUser({
        id,
        email,
        password_hash,
        full_name,
        rules_accepted_at: new Date(),
        email_verified: true,
      });
      await repoAssignRole(id, role);
      await repoEnsureProfileRow(id, {
        full_name: full_name ?? null,
        phone: null,
        avatar_url: avatar_url ?? null,
      });

      void sendWelcomeMail({
        to: email,
        user_name: full_name || email.split('@')[0],
        user_email: email,
      }).catch((err) => req.log?.error?.(err, 'google_welcome_mail_failed'));
      void telegramNotify({
        event: 'new_user',
        data: {
          user_name: full_name || email.split('@')[0],
          user_email: email,
          role,
          source: 'google',
          created_at: new Date().toISOString(),
        },
      });

      user = await repoGetUserById(id);
    } else {
      await repoSyncGoogleUser(user.id, {
        full_name: full_name ?? user.full_name ?? null,
        email_verified: true,
      });
      await repoEnsureProfileRow(user.id, {
        full_name: full_name ?? user.full_name ?? null,
        phone: null,
        avatar_url: avatar_url ?? null,
      });
      user = await repoGetUserById(user.id);
    }

    if (!user) {
      return reply.status(500).send({ error: { message: 'google_user_resolution_failed' } });
    }

    await repoUpdateLastSignIn(user.id);
    const role = await getPrimaryRole(user.id);
    if (rejectNonAdmin(role, reply)) return;
    const { access, refresh } = await issueTokens(req.server, user, role);
    setAccessCookie(reply, access);
    setRefreshCookie(reply, refresh);

    return reply.send({
      access_token: access,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name ?? full_name ?? null,
        phone: user.phone ?? null,
        email_verified: 1,
        is_active: user.is_active,
        ecosystem_id: user.ecosystem_id ?? null,
        role,
      },
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_google');
  }
}

/** POST /auth/token/refresh */
export async function refresh(req: FastifyRequest, reply: FastifyReply) {
  try {
    const jwt = getJWTFromReq(req);
    const raw = ((req.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? '').trim();
    if (!raw.includes('.')) return reply.status(401).send({ error: { message: 'no_refresh' } });

    const jti = raw.split('.', 1)[0] ?? '';
    const row = await repoGetRefreshToken(jti);
    if (!row) return reply.status(401).send({ error: { message: 'invalid_refresh' } });
    if (row.revoked_at) return reply.status(401).send({ error: { message: 'refresh_revoked' } });
    if (new Date(row.expires_at).getTime() < Date.now()) return reply.status(401).send({ error: { message: 'refresh_expired' } });

    const { createHash } = await import('crypto');
    const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
    if (row.token_hash !== sha256(raw)) return reply.status(401).send({ error: { message: 'invalid_refresh' } });

    const u = await repoGetUserById(row.user_id);
    if (!u) return reply.status(401).send({ error: { message: 'invalid_user' } });

    const role = await getPrimaryRole(u.id);
    if (rejectNonAdmin(role, reply)) return;
    const access = jwt.sign({ sub: u.id, email: u.email ?? undefined, role }, { expiresIn: `${ACCESS_MAX_AGE}s` });
    const newRaw = await repoRotateRefreshToken(raw, u.id);
    setAccessCookie(reply, access);
    setRefreshCookie(reply, newRaw);

    return reply.send({ access_token: access, token_type: 'bearer' });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_refresh');
  }
}

/** POST /auth/password-reset/request */
export async function passwordResetRequest(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = passwordResetRequestBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'invalid_body' });

    const jwt = getJWTFromReq(req);
    const u = await repoGetUserByEmail(parsed.data.email.toLowerCase());
    if (!u) return reply.send({ success: true, message: 'Eğer bu e-posta ile bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.' });

    const resetToken = jwt.sign({ sub: u.id, email: u.email ?? undefined, purpose: 'password_reset' as const }, { expiresIn: '1h' });
    return reply.send({ success: true, token: resetToken });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_password_reset_request');
  }
}

/** POST /auth/password-reset/confirm */
export async function passwordResetConfirm(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = passwordResetConfirmBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ success: false, error: 'invalid_body' });

    const jwt = getJWTFromReq(req);
    let payload: JWTPayload;
    try {
      payload = jwt.verify(parsed.data.token);
    } catch {
      return reply.status(400).send({ success: false, error: 'invalid_or_expired_token' });
    }

    if (payload.purpose !== 'password_reset' || !payload.sub) {
      return reply.status(400).send({ success: false, error: 'invalid_token_payload' });
    }

    const u = await repoGetUserById(payload.sub);
    if (!u) return reply.status(404).send({ success: false, error: 'user_not_found' });

    await repoRevokeAllUserRefreshTokens(u.id);
    await repoUpdateUserPassword(u.id, parsed.data.password);

    try { await repoCreatePasswordChangedNotification(u.id); } catch (err) { req.log.error({ err }, 'password_change_notification_failed'); }

    if (u.email) {
      void sendPasswordChangedMail({ to: u.email, user_name: u.email.split('@')[0] }).catch((err) => req.log.error({ err }, 'password_change_mail_failed'));
    }

    return reply.send({ success: true, message: 'Parolanız başarıyla güncellendi.' });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_password_reset_confirm');
  }
}

/** GET /auth/user */
export async function me(req: FastifyRequest, reply: FastifyReply) {
  try {
    const jwt = getJWTFromReq(req);
    const t = bearerFrom(req);
    if (!t) return reply.status(401).send({ error: { message: 'no_token' } });

    const p = jwt.verify(t);
    const u = await repoGetUserById(p.sub);
    if (!u) return reply.status(401).send({ error: { message: 'invalid_token' } });
    const role = await getPrimaryRole(p.sub);
    if (rejectNonAdmin(role, reply)) return;
    return reply.send({
      user: {
        id: u.id,
        email: u.email ?? null,
        full_name: u.full_name ?? null,
        phone: u.phone ?? null,
        email_verified: u.email_verified,
        is_active: u.is_active,
        ecosystem_id: u.ecosystem_id ?? null,
        role,
      },
    });
  } catch {
    return reply.status(401).send({ error: { message: 'invalid_token' } });
  }
}

/** GET /auth/status */
export async function status(req: FastifyRequest, reply: FastifyReply) {
  const jwt = getJWTFromReq(req);
  const t = bearerFrom(req);
  if (!t) return reply.send({ authenticated: false, is_admin: false });

  try {
    const p = jwt.verify(t);
    const role = await getPrimaryRole(p.sub);
    return reply.send({ authenticated: true, is_admin: role === 'admin', user: { id: p.sub, email: p.email ?? null, role } });
  } catch {
    return reply.send({ authenticated: false, is_admin: false });
  }
}

/** PUT /auth/user */
export async function update(req: FastifyRequest, reply: FastifyReply) {
  try {
    const jwt = getJWTFromReq(req);
    const t = bearerFrom(req);
    if (!t) return reply.status(401).send({ error: { message: 'no_token' } });

    let p: JWTPayload;
    try { p = jwt.verify(t); } catch { return reply.status(401).send({ error: { message: 'invalid_token' } }); }

    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

    const { email, password } = parsed.data as { email?: string; password?: string };

    if (email) { await repoUpdateUserEmail(p.sub, email); p.email = email; }
    if (password) {
      await repoUpdateUserPassword(p.sub, password);
      try { await repoCreatePasswordChangedNotification(p.sub); } catch (err) { req.log.error({ err }, 'password_change_notification_failed'); }
      const targetEmail = email ?? p.email;
      if (targetEmail) {
        void sendPasswordChangedMail({ to: targetEmail, user_name: targetEmail.split('@')[0] }).catch((err) => req.log.error({ err }, 'password_change_mail_failed'));
      }
    }

    const u = await repoGetUserById(p.sub);
    const role = await getPrimaryRole(p.sub);
    return reply.send({
      user: {
        id: p.sub,
        email: p.email ?? null,
        full_name: u?.full_name ?? null,
        phone: u?.phone ?? null,
        email_verified: u?.email_verified ?? 0,
        is_active: u?.is_active ?? 1,
        ecosystem_id: u?.ecosystem_id ?? null,
        role,
      },
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_update');
  }
}

/** POST /auth/logout */
export async function logout(req: FastifyRequest, reply: FastifyReply) {
  try {
    const raw = ((reply.request?.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? '').trim();
    if (raw.includes('.')) {
      const jti = raw.split('.', 1)[0] ?? '';
      await repoRevokeRefreshToken(jti);
    }
    clearAuthCookies(reply);
    return reply.status(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'auth_logout');
  }
}
