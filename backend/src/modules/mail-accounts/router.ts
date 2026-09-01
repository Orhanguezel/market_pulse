import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import {
  createImapAccountHandler,
  deleteAccountHandler,
  gmailCallbackHandler,
  gmailConnectHandler,
  inboxHandler,
  listAccountsHandler,
  messageHandler,
  sendMailHandler,
} from './controller';

export async function registerMailAccountsUser(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('email-marketing')] };
  const routeHandler = <T>(handler: T) => handler as never;
  app.get('/mail/accounts', guard, routeHandler(listAccountsHandler));
  app.get('/mail/accounts/gmail/connect', guard, routeHandler(gmailConnectHandler));
  app.get('/mail/accounts/gmail/callback', routeHandler(gmailCallbackHandler));
  app.post('/mail/accounts/imap', guard, routeHandler(createImapAccountHandler));
  app.delete('/mail/accounts/:id', guard, routeHandler(deleteAccountHandler));
  app.get('/mail/inbox', guard, routeHandler(inboxHandler));
  app.get('/mail/messages/:id', guard, routeHandler(messageHandler));
  app.post('/mail/send', guard, routeHandler(sendMailHandler));
}
