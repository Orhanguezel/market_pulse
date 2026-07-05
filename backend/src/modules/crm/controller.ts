import type { FastifyReply, FastifyRequest } from 'fastify';
import { getActiveUserId } from '@/modules/_shared';
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
  documentBodySchema,
  documentPatchSchema,
  idParamsSchema,
  listQuerySchema,
  orderBodySchema,
  orderPatchSchema,
  pipelineBodySchema,
  productBodySchema,
  productPatchSchema,
  quoteBodySchema,
  quotePatchSchema,
  reminderBodySchema,
  reminderPatchSchema,
  taskBodySchema,
  taskPatchSchema,
} from './schema';
import { createAccount, deleteAccount, getAccount, listAccounts, updateAccount } from './accounts.service';
import { createContact, deleteContact, getContact, listContacts, updateContact } from './contacts.service';
import { createPipeline, listPipelines, listStages } from './pipelines.service';
import { createDeal, deleteDeal, getDeal, listDeals, moveDealStage, updateDeal } from './deals.service';
import { createActivity, deleteActivity, listActivities, updateActivity } from './activities.service';
import { convertLeadCandidate } from './convert.service';
import { getDashboardSummary } from './dashboard.service';
import { createBusinessRecord, deleteBusinessRecord, getBusinessRecord, listBusinessRecords, updateBusinessRecord } from './business-records.service';
import { getBusinessSummary, getMailSummary, getReportsSummary, getUsersSummary } from './insights.service';

function badRequest(reply: FastifyReply) {
  return reply.code(400).send({ error: { message: 'invalid_request' } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { message: 'not_found' } });
}

function ownerForRequest(req: FastifyRequest): string | null {
  return req.url.includes('/admin/') ? null : getActiveUserId() ?? null;
}

async function deleteBusinessRecordHandler(
  resource: 'products' | 'quotes' | 'orders' | 'documents' | 'tasks' | 'reminders',
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  await deleteBusinessRecord(resource, params.data.id);
  return reply.code(204).send();
}

export async function listAccountsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listAccounts(query.data, ownerForRequest(req));
}

export async function dashboardSummaryHandler(req: FastifyRequest) {
  return getDashboardSummary(ownerForRequest(req));
}

export async function mailSummaryHandler(req: FastifyRequest) {
  return getMailSummary(ownerForRequest(req));
}

export async function reportsSummaryHandler(req: FastifyRequest) {
  return getReportsSummary(ownerForRequest(req));
}

export async function usersSummaryHandler() {
  return getUsersSummary();
}

export async function businessSummaryHandler() {
  return getBusinessSummary();
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
  const account = await getAccount(params.data.id, ownerForRequest(req));
  return account ?? notFound(reply);
}

export async function updateAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = accountPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const account = await updateAccount(params.data.id, body.data, ownerForRequest(req));
  return account ?? notFound(reply);
}

export async function deleteAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  await deleteAccount(params.data.id, ownerForRequest(req));
  return reply.code(204).send();
}

export async function listContactsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.extend({ account_id: idParamsSchema.shape.id.optional() }).safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listContacts(query.data, ownerForRequest(req));
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
  const contact = await getContact(params.data.id, ownerForRequest(req));
  return contact ?? notFound(reply);
}

export async function updateContactHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = contactPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const contact = await updateContact(params.data.id, body.data, ownerForRequest(req));
  return contact ?? notFound(reply);
}

export async function deleteContactHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  await deleteContact(params.data.id, ownerForRequest(req));
  return reply.code(204).send();
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
  return listDeals(query.data, ownerForRequest(req));
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
  const deal = await getDeal(params.data.id, ownerForRequest(req));
  return deal ?? notFound(reply);
}

export async function updateDealHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = dealPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const deal = await updateDeal(params.data.id, body.data, ownerForRequest(req));
  return deal ?? notFound(reply);
}

export async function moveDealStageHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = dealStageBodySchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const deal = await moveDealStage(params.data.id, body.data.stage_id, ownerForRequest(req));
  return deal ?? notFound(reply);
}

export async function deleteDealHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  await deleteDeal(params.data.id, ownerForRequest(req));
  return reply.code(204).send();
}

export async function listActivitiesHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.extend({
    ref_type: activityBodySchema.shape.ref_type.optional(),
    ref_id: idParamsSchema.shape.id.optional(),
  }).safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listActivities(query.data, ownerForRequest(req));
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
  const activity = await updateActivity(params.data.id, body.data, ownerForRequest(req));
  return activity ?? notFound(reply);
}

export async function deleteActivityHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  await deleteActivity(params.data.id, ownerForRequest(req));
  return reply.code(204).send();
}

export async function convertLeadHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = convertLeadBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const result = await convertLeadCandidate(body.data, ownerForRequest(req));
  return result ?? notFound(reply);
}

export async function listProductsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('products', query.data);
}

export async function createProductHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = productBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('products', body.data);
  return reply.code(201).send(record);
}

export async function getProductHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('products', params.data.id);
  return record ?? notFound(reply);
}

export async function updateProductHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = productPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('products', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteProductHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('products', req, reply);
}

export async function listQuotesHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('quotes', query.data);
}

export async function createQuoteHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = quoteBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('quotes', body.data);
  return reply.code(201).send(record);
}

export async function getQuoteHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('quotes', params.data.id);
  return record ?? notFound(reply);
}

export async function updateQuoteHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = quotePatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('quotes', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteQuoteHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('quotes', req, reply);
}

export async function listOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('orders', query.data);
}

export async function createOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = orderBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('orders', body.data);
  return reply.code(201).send(record);
}

export async function getOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('orders', params.data.id);
  return record ?? notFound(reply);
}

export async function updateOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = orderPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('orders', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('orders', req, reply);
}

export async function listDocumentsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('documents', query.data);
}

export async function createDocumentHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = documentBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('documents', body.data);
  return reply.code(201).send(record);
}

export async function getDocumentHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('documents', params.data.id);
  return record ?? notFound(reply);
}

export async function updateDocumentHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = documentPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('documents', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteDocumentHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('documents', req, reply);
}

export async function listTasksHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('tasks', query.data);
}

export async function createTaskHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = taskBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('tasks', body.data);
  return reply.code(201).send(record);
}

export async function getTaskHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('tasks', params.data.id);
  return record ?? notFound(reply);
}

export async function updateTaskHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = taskPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('tasks', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteTaskHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('tasks', req, reply);
}

export async function listRemindersHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) return badRequest(reply);
  return listBusinessRecords('reminders', query.data);
}

export async function createReminderHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = reminderBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(reply);
  const record = await createBusinessRecord('reminders', body.data);
  return reply.code(201).send(record);
}

export async function getReminderHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return badRequest(reply);
  const record = await getBusinessRecord('reminders', params.data.id);
  return record ?? notFound(reply);
}

export async function updateReminderHandler(req: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(req.params);
  const body = reminderPatchSchema.safeParse(req.body);
  if (!params.success || !body.success) return badRequest(reply);
  const record = await updateBusinessRecord('reminders', params.data.id, body.data);
  return record ?? notFound(reply);
}

export async function deleteReminderHandler(req: FastifyRequest, reply: FastifyReply) {
  return deleteBusinessRecordHandler('reminders', req, reply);
}
