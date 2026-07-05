'use client';

import * as React from 'react';

export type PollableJob = {
  status?: string | null;
};

type QueryResult<TJob> = {
  data?: TJob;
  isError?: boolean;
  isFetching?: boolean;
  refetch?: () => unknown;
};

type QueryOptions = {
  pollingInterval?: number;
  skip?: boolean;
};

type UseJobQuery<TJob> = (jobId: string, options: QueryOptions) => QueryResult<TJob>;

type UseJobPollingOptions<TJob extends PollableJob> = {
  jobId: string | null;
  useJobQuery: UseJobQuery<TJob>;
  intervalMs?: number;
  terminalStatuses?: string[];
  onDone?: (job: TJob) => void;
  onFailed?: (job: TJob) => void;
};

export function useJobPolling<TJob extends PollableJob>({
  jobId,
  useJobQuery,
  intervalMs = 3000,
  terminalStatuses = ['done', 'failed'],
  onDone,
  onFailed,
}: UseJobPollingOptions<TJob>) {
  const result = useJobQuery(jobId ?? '', {
    pollingInterval: jobId ? intervalMs : 0,
    skip: !jobId,
  });

  const status = result.data?.status ?? null;
  const isTerminal = Boolean(status && terminalStatuses.includes(status));
  const isRunning = Boolean(status && !isTerminal);
  const completedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!jobId || !result.data || !isTerminal || completedRef.current === `${jobId}:${status}`) return;
    completedRef.current = `${jobId}:${status}`;
    if (status === 'done') onDone?.(result.data);
    if (status === 'failed') onFailed?.(result.data);
  }, [isTerminal, jobId, onDone, onFailed, result.data, status]);

  return {
    ...result,
    status,
    isRunning,
    isTerminal,
  };
}
