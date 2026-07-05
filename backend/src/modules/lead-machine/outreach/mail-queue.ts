import type { FastifyInstance } from 'fastify';
import { Queue, Worker, type ConnectionOptions, type JobsOptions, type WorkerOptions } from 'bullmq';
import { env } from '@/core/env';
import { runWithTenantAndUser, runWithTenant } from '@/core/tenant-context';
import { sendOutreachDraft } from './outreach.service';
import { bumpListCounts, markRecipient, reconcileListSendStatus, type RecipientRow } from './bulk-list.repository';

const QUEUE_NAME = 'mail:outreach';

type BulkRecipientMailJob = {
  kind: 'bulk_recipient';
  tenantKey: string;
  ownerUserId: string | null;
  listId: string;
  recipientId: string;
  draftId: string;
  email: string;
};

let queue: Queue<BulkRecipientMailJob, void, 'bulk-recipient'> | null = null;
let worker: Worker<BulkRecipientMailJob, void, 'bulk-recipient'> | null = null;

function redisConnection(): ConnectionOptions {
  if (!env.REDIS_URL) throw new Error('MAIL_QUEUE_REDIS_NOT_CONFIGURED');
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

function getQueue() {
  if (!queue) {
    queue = new Queue<BulkRecipientMailJob, void, 'bulk-recipient'>(QUEUE_NAME, {
      connection: redisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { age: 7 * 24 * 60 * 60, count: 5000 },
        removeOnFail: { age: 30 * 24 * 60 * 60, count: 5000 },
      },
    });
  }
  return queue;
}

export function assertMailQueueAvailable() {
  if (!env.REDIS_URL) throw new Error('MAIL_QUEUE_REDIS_NOT_CONFIGURED');
}

async function withTenant<T>(tenantKey: string, ownerUserId: string | null, fn: () => Promise<T>) {
  return ownerUserId
    ? runWithTenantAndUser(tenantKey, ownerUserId, fn)
    : runWithTenant(tenantKey, fn);
}

async function processBulkRecipient(job: BulkRecipientMailJob) {
  await withTenant(job.tenantKey, job.ownerUserId, async () => {
    await sendOutreachDraft(job.draftId, job.email);
    await markRecipient(job.tenantKey, job.recipientId, { status: 'sent' }, job.ownerUserId);
    await bumpListCounts(job.tenantKey, job.listId, { sentDelta: 1 }, job.ownerUserId);
    await reconcileListSendStatus(job.tenantKey, job.listId, job.ownerUserId);
  });
}

export async function enqueueBulkRecipientEmails(
  tenantKey: string,
  listId: string,
  recipients: RecipientRow[],
  opts: { ownerUserId?: string | null; ratePerMinute: number },
) {
  assertMailQueueAvailable();
  const q = getQueue();
  const delayMs = Math.floor(60_000 / Math.max(1, opts.ratePerMinute));
  const jobs = recipients.map((recipient, index) => {
    if (!recipient.draft_id || !recipient.email) return null;
    const options: JobsOptions = {
      jobId: `bulk:${tenantKey}:${listId}:${recipient.id}`,
      delay: index * delayMs,
    };
    return {
      name: 'bulk-recipient' as const,
      data: {
        kind: 'bulk_recipient' as const,
        tenantKey,
        ownerUserId: opts.ownerUserId ?? null,
        listId,
        recipientId: recipient.id,
        draftId: recipient.draft_id,
        email: recipient.email,
      },
      opts: options,
    };
  }).filter((job): job is Exclude<typeof job, null> => job !== null);
  if (!jobs.length) return { queued: 0 };
  const currentQueue = q;
  await currentQueue.addBulk(jobs);
  return { queued: jobs.length };
}

export function registerMailQueueWorker(app: FastifyInstance) {
  if (!env.REDIS_URL) {
    app.log.info('Mail queue worker disabled: REDIS_URL not configured');
    return;
  }

  const options: WorkerOptions = {
    connection: redisConnection(),
    concurrency: 3,
  };
  worker = new Worker<BulkRecipientMailJob, void, 'bulk-recipient'>(QUEUE_NAME, async (job) => {
    if (job.data.kind === 'bulk_recipient') await processBulkRecipient(job.data);
  }, options);

  worker.on('completed', (job) => app.log.info({ job_id: job.id, list_id: job.data.listId }, 'mail_queue_job_completed'));
  worker.on('failed', async (job, err) => {
    app.log.error({ err, job_id: job?.id, list_id: job?.data.listId }, 'mail_queue_job_failed');
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
    await withTenant(job.data.tenantKey, job.data.ownerUserId, async () => {
      await markRecipient(job.data.tenantKey, job.data.recipientId, { status: 'bounced' }, job.data.ownerUserId);
      await reconcileListSendStatus(job.data.tenantKey, job.data.listId, job.data.ownerUserId);
    }).catch((markErr) => app.log.error({ err: markErr, job_id: job.id }, 'mail_queue_bounce_mark_failed'));
  });

  app.addHook('onClose', async () => {
    await worker?.close();
    worker = null;
    await queue?.close();
    queue = null;
  });
}
