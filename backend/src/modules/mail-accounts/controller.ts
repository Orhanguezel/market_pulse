import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { getAuthUserId, handleRouteError } from '@/modules/_shared';
import {
  createGmailConnectUrl,
  deleteMailAccount,
  getMessage,
  handleGmailCallback,
  listInbox,
  listMailAccounts,
  saveImapSmtpAccount,
  sendUserMail,
} from './service';

const imapSchema = z.object({
  email: z.string().email(),
  displayName: z.string().max(255).nullable().optional(),
  imapHost: z.string().max(255).nullable().optional(),
  imapPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpHost: z.string().max(255),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean().nullable().optional(),
  smtpUsername: z.string().max(255).nullable().optional(),
  password: z.string().min(1).max(2000),
});

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  html: z.string().min(1),
  text: z.string().optional(),
  replyTo: z.string().email().nullable().optional(),
});

export async function listAccountsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return await listMailAccounts(getAuthUserId(req));
  } catch (err) {
    return handleRouteError(reply, req, err, 'mail_accounts_list_failed');
  }
}

export async function gmailConnectHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    return await createGmailConnectUrl(getAuthUserId(req));
  } catch (err) {
    return handleRouteError(reply, req, err, 'gmail_connect_failed');
  }
}

export async function gmailCallbackHandler(req: FastifyRequest<{ Querystring: { code?: string; state?: string } }>, reply: FastifyReply) {
  try {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');
    if (!code || !state) return reply.code(400).send({ error: { message: 'missing_oauth_params' } });
    const result = await handleGmailCallback(code, state);
    return reply.redirect(result.redirect);
  } catch (err) {
    req.log.error({ err }, 'gmail_callback_failed');
    return reply.redirect('/tr/mail-yonetimi?mail=error');
  }
}

export async function createImapAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = imapSchema.parse(req.body);
    return reply.code(201).send(await saveImapSmtpAccount(getAuthUserId(req), body));
  } catch (err) {
    return handleRouteError(reply, req, err, 'mail_imap_create_failed');
  }
}

export async function deleteAccountHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await deleteMailAccount(getAuthUserId(req), req.params.id);
    return reply.code(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'mail_account_delete_failed');
  }
}

export async function inboxHandler(req: FastifyRequest<{ Querystring: { folder?: string; pageToken?: string; limit?: string } }>, reply: FastifyReply) {
  try {
    return await listInbox(getAuthUserId(req), {
      folder: req.query.folder,
      pageToken: req.query.pageToken,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
  } catch (err) {
    return handleRouteError(reply, req, err, 'mail_inbox_failed');
  }
}

export async function messageHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const message = await getMessage(getAuthUserId(req), req.params.id);
    if (!message) return reply.code(404).send({ error: { message: 'not_found' } });
    return message;
  } catch (err) {
    return handleRouteError(reply, req, err, 'mail_message_failed');
  }
}

export async function sendMailHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = sendSchema.parse(req.body);
    await sendUserMail(getAuthUserId(req), body);
    return { ok: true };
  } catch (err) {
    const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err ? Number((err as { statusCode?: number }).statusCode) : 0;
    if (statusCode === 429) {
      return reply.code(429).send({
        error: {
          message: (err as Error).message,
          code: (err as { code?: string }).code,
          quota: (err as { quota?: unknown }).quota,
        },
      });
    }
    return handleRouteError(reply, req, err, 'mail_send_failed');
  }
}
