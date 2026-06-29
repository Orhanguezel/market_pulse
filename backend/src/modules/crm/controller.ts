import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  accountBodySchema,
  accountPatchSchema,
  activityBodySchema,
  activityPatchSchema,
  contactBodySchema,
  contactPatchSchema,
  convertLeadBodySchema,
  dealBodySchema,
  dealPatchSchema,
  dealStageBodySchema,
  idParamsSchema,
  listQuerySchema,
  pipelineBodySchema,
} from './schema';
import { createAccount, getAccount, listAccounts, updateAccount } from './accounts.service';
import { createContact, getContact, listContacts, updateContact } from './contacts.service';
import { createPipeline, listPipelines, listStages } from './pipelines.service';
import { createDeal, getDeal, listDeals, moveDealStage, updateDeal } from './deals.service';
import { createActivity, listActivities, updateActivity } from './activities.service';
import { convertLeadCandidate } from './convert.service';

function badRequest(reply: FastifyReply) {
  return reply.code(400).send({ error: { message: 'invalid_request' } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { message: 'not_found' } });
}

export async function listAccountsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listAccounts(query.data);
}

export async function createAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = accountBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const account = await createAccount(body.data);
  return reply.code(201).send(account);
}

export async function getAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const account = await getAccount(params.data.id);
  return account ?? notFound(reply);
}

export async function updateAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = accountPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const account = await updateAccount(params.data.id, body.data);
  return account ?? notFound(reply);
}

export async function listContactsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.extend({ account_id: idParamsSchema.shape.id.optional() }).safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listContacts(query.data);
}

export async function createContactHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = contactBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const contact = await createContact(body.data);
  return reply.code(201).send(contact);
}

export async function getContactHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const contact = await getContact(params.data.id);
  return contact ?? notFound(reply);
}

export async function updateContactHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = contactPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const contact = await updateContact(params.data.id, body.data);
  return contact ?? notFound(reply);
}

export async function listPipelinesHandler() {
  const [pipelines, stages] = await Promise.all([listPipelines(), listStages()]);
  return { pipelines, stages };
}

export async function createPipelineHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = pipelineBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const pipeline = await createPipeline(body.data);
  return reply.code(201).send(pipeline);
}

export async function listDealsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.extend({
    stage_id: idParamsSchema.shape.id.optional(),
    account_id: idParamsSchema.shape.id.optional(),
  }).safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listDeals(query.data);
}

export async function createDealHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = dealBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const deal = await createDeal(body.data);
  return reply.code(201).send(deal);
}

export async function getDealHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const deal = await getDeal(params.data.id);
  return deal ?? notFound(reply);
}

export async function updateDealHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = dealPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const deal = await updateDeal(params.data.id, body.data);
  return deal ?? notFound(reply);
}

export async function moveDealStageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = dealStageBodySchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const deal = await moveDealStage(params.data.id, body.data.stage_id);
  return deal ?? notFound(reply);
}

export async function listActivitiesHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.extend({
    ref_type: activityBodySchema.shape.ref_type.optional(),
    ref_id: idParamsSchema.shape.id.optional(),
  }).safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listActivities(query.data);
}

export async function createActivityHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = activityBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const activity = await createActivity(body.data);
  return reply.code(201).send(activity);
}

export async function updateActivityHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = activityPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const activity = await updateActivity(params.data.id, body.data);
  return activity ?? notFound(reply);
}

export async function convertLeadHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = convertLeadBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const result = await convertLeadCandidate(body.data);
  return result ?? notFound(reply);
}
