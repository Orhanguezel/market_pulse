'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  ChevronRight,
  CircleAlert,
  Clock,
  Download,
  FileText,
  Info,
  Loader2,
  LogOut,
  Printer,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath } from '@/integrations/shared';
import {
  useGetMyQuotaQuery,
  useStartPublicScanMutation,
  useGetPublicScanQuery,
  useGetAmazonHistoryQuery,
  type RiskReport,
  type ScanHistoryItem,
} from '@/integrations/rtk/hooks';
import { PublicRiskCard } from '@/components/amazon/public-risk-card';
import PublicProfitCalculator from '@/components/amazon/public-profit-calculator';
import PublicEvidenceTable from '@/components/amazon/public-evidence-table';
import PublicMultiKeyword from '@/components/amazon/public-multi-keyword';
import PublicSavedSearches from '@/components/amazon/public-saved-searches';
import KeepaBudgetWidget from '@/components/amazon/keepa-budget-widget';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const MARKETPLACES = [
  { code: 'com', label: 'Amazon.com (US)' },
  { code: 'de', label: 'Amazon.de (DE)' },
  { code: 'co.uk', label: 'Amazon.co.uk (UK)' },
  { code: 'fr', label: 'Amazon.fr (FR)' },
  { code: 'it', label: 'Amazon.it (IT)' },
  { code: 'es', label: 'Amazon.es (ES)' },
  { code: 'nl', label: 'Amazon.nl (NL)' },
  { code: 'pl', label: 'Amazon.pl (PL)' },
];

const PLAN_LABELS: Record<string, string> = {
  free: 'Ücretsiz',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Ajans',
};

// ─── JobPoller ────────────────────────────────────────────────────────────────

function JobPoller({
  jobId,
  onDone,
}: {
  jobId: string;
  onDone: (report: RiskReport, keyword: string, marketplace: string, completedJobId: string) => void;
}) {
  const { data, isError } = useGetPublicScanQuery(jobId, {
    pollingInterval: 3000,
  });

  React.useEffect(() => {
    if (data?.status === 'done' && data.risk_report) {
      const p = data.params ?? {};
      onDone(data.risk_report, p.keyword ?? '', p.marketplace ?? 'com', jobId);
    }
  }, [data, jobId, onDone]);

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-500">
        Analiz alınamadı. Lütfen tekrar deneyin.
      </div>
    );
  }

  const statusLabel =
    data?.status === 'running' ? 'Analiz ediliyor…'
    : data?.status === 'failed' ? 'Analiz başarısız'
    : 'Başlatılıyor…';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 px-5 py-4">
      {data?.status === 'failed'
        ? <CircleAlert className="size-4 shrink-0 text-red-500" />
        : <Loader2 className="size-4 shrink-0 animate-spin text-(--gm-primary)" />}
      <div>
        <p className="text-sm font-medium text-(--gm-text)">{statusLabel}</p>
        <p className="text-[11px] text-(--gm-muted)">Scraping + puanlama yapılıyor, ~30-60 saniye sürebilir</p>
      </div>
    </div>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

function HistoryItem({ item, onClick }: { item: ScanHistoryItem; onClick: () => void }) {
  const done = item.status === 'done';
  const decision = item.decision ?? '';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 px-4 py-3 text-left hover:bg-(--gm-surface)/20 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-(--gm-text)">{item.keyword}</p>
        <p className="text-[11px] text-(--gm-muted)">
          {item.marketplace ? `amazon.${item.marketplace}` : '—'}
          {' · '}
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </p>
      </div>
      {done && decision ? (
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest shrink-0',
          decision === 'GUVENLI' ? 'text-emerald-500'
            : decision === 'GIRME' ? 'text-red-500'
            : 'text-yellow-500'
        )}>
          {decision === 'GUVENLI' ? 'Güvenli' : decision === 'GIRME' ? 'Girme' : decision === 'DIKKATLI_OL' ? 'Dikkat' : decision}
        </span>
      ) : (
        <span className="text-[10px] text-(--gm-muted) uppercase tracking-widest shrink-0">{item.status}</span>
      )}
      <ChevronRight className="size-4 shrink-0 text-(--gm-muted)" />
    </button>
  );
}

// ─── CSV export ──────────────────────────────────────────────────────────────

function exportCsv(report: RiskReport, keyword: string, marketplace: string) {
  const dims = ['category_risk', 'sku_chaos', 'price_war_risk', 'brand_reliability', 'operational_risk'] as const;
  const header = [
    'keyword', 'marketplace', 'composite_score', 'decision',
    ...dims.flatMap((d) => [`${d}_score`, `${d}_confidence`]),
    'data_points', 'summary',
  ].join(',');

  const row = [
    `"${keyword}"`,
    marketplace,
    report.composite_score ?? '',
    report.decision ?? '',
    ...dims.flatMap((d) => {
      const s = report.dimensions?.[d];
      return [s?.score ?? '', `"${s?.confidence ?? ''}"`];
    }),
    report.data_points ?? '',
    `"${(report.summary ?? '').replace(/"/g, '""')}"`,
  ].join(',');

  const bom = '﻿';
  const blob = new Blob([bom + header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marketpulse-${keyword.replace(/\s+/g, '-')}-${marketplace}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading, isReady } = useAuthStore();

  const [keyword, setKeyword] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('com');
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ report: RiskReport; keyword: string; marketplace: string; jobId: string } | null>(null);

  const { data: quota, refetch: refetchQuota } = useGetMyQuotaQuery(undefined, { skip: !user });
  const { data: history, refetch: refetchHistory } = useGetAmazonHistoryQuery(undefined, { skip: !user });
  const [startScan, { isLoading: isScanning }] = useStartPublicScanMutation();

  React.useEffect(() => {
    if (isReady && !user) {
      router.replace(localizePath(locale, '/login'));
    }
  }, [user, isReady, locale, router]);

  const handleScan = async () => {
    if (!keyword.trim() || isScanning) return;
    setResult(null);
    setActiveJobId(null);
    try {
      const job = await startScan({ keyword: keyword.trim(), marketplace }).unwrap();
      setActiveJobId(job.id);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      if (msg === 'daily_limit_reached') {
        alert('Günlük analiz limitinize ulaştınız. Planınızı yükseltin.');
      }
    }
  };

  const handleDone = React.useCallback((report: RiskReport, kw: string, mp: string, completedJobId: string) => {
    setActiveJobId(null);
    setResult({ report, keyword: kw, marketplace: mp, jobId: completedJobId });
    refetchQuota();
    refetchHistory();
  }, [refetchQuota, refetchHistory]);

  const handleHistoryClick = (item: ScanHistoryItem) => {
    setKeyword(item.keyword);
    setMarketplace(item.marketplace ?? 'com');
    if (item.status === 'done' && item.decision) {
      // Trigger a fresh lookup via refetch or just re-scan
    }
  };

  if (authLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-(--gm-primary)" />
      </div>
    );
  }
  if (!user) return null;

  const canScan = !isScanning && !activeJobId && keyword.trim().length > 0
    && (quota?.unlimited || (quota?.remaining ?? 1) > 0);

  return (
    <div className="min-h-screen bg-(--gm-bg)">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-(--gm-border-soft) bg-(--gm-bg)/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="size-5 text-(--gm-primary)" />
            <span className="font-display font-bold text-(--gm-text)">MarketPulse</span>
          </div>
          <div className="flex items-center gap-3">
            {quota && (
              <span className="text-[11px] font-medium text-(--gm-muted)">
                {quota.unlimited ? '∞' : `${quota.used_today} / ${quota.daily_limit}`} analiz
                <span className="ml-1.5 rounded-full border border-(--gm-border-soft) px-2 py-0.5 text-[10px] uppercase tracking-widest">
                  {PLAN_LABELS[quota.plan] ?? quota.plan}
                </span>
              </span>
            )}
            <Link
              href={localizePath(locale, '/pricing')}
              className="hidden text-[11px] font-bold uppercase tracking-widest text-(--gm-primary) hover:opacity-80 sm:block"
            >
              <Zap className="mr-1 inline size-3" />
              Yükselt
            </Link>
            <button
              type="button"
              onClick={() => router.push(localizePath(locale, '/'))}
              className="text-(--gm-muted) hover:text-(--gm-text) transition-colors"
              title="Çıkış"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Keepa budget widget (only if BYOK key) */}
        <KeepaBudgetWidget locale={locale} />

        {/* Scan form */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-(--gm-primary)">Amazon Kategori Analizi</p>
            <h1 className="font-display text-2xl font-bold text-(--gm-text) mt-1">
              Keyword gir, riski ölç
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
              placeholder="floor mats, phone holder, yoga mat…"
              className="h-12 flex-1 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/60 focus:border-(--gm-primary) focus:outline-none"
            />
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="h-12 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-sm text-(--gm-text) focus:border-(--gm-primary) focus:outline-none"
            >
              {MARKETPLACES.map((m) => (
                <option key={m.code} value={m.code}>{m.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleScan}
              disabled={!canScan}
              className={cn(
                'flex h-12 items-center gap-2 rounded-2xl px-6 text-[11px] font-bold uppercase tracking-widest transition-all',
                canScan
                  ? 'bg-(--gm-primary) text-white hover:opacity-90'
                  : 'cursor-not-allowed bg-(--gm-surface) text-(--gm-muted)',
              )}
            >
              {isScanning
                ? <Loader2 className="size-4 animate-spin" />
                : <Search className="size-4" />}
              Analiz Et
            </button>
          </div>

          {/* Quota warning */}
          {quota && !quota.unlimited && quota.remaining === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-600">
              <Info className="size-4 shrink-0" />
              <span>Günlük limitiniz doldu.</span>
              <Link href={localizePath(locale, '/pricing')} className="font-bold underline">Planı yükselt</Link>
            </div>
          )}
        </div>

        {/* Active job poller */}
        {activeJobId && (
          <JobPoller jobId={activeJobId} onDone={handleDone} />
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 print:space-y-6">
            {/* Export actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-(--gm-muted)">
                <FileText className="mr-1.5 inline size-3" />
                Analiz Sonucu — <span className="text-(--gm-text)">{result.keyword}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportCsv(result.report, result.keyword, result.marketplace)}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-[10px] font-bold uppercase tracking-widest text-(--gm-text) hover:bg-(--gm-surface)/40 transition-colors"
                >
                  <Download className="size-3" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-[10px] font-bold uppercase tracking-widest text-(--gm-text) hover:bg-(--gm-surface)/40 transition-colors"
                >
                  <Printer className="size-3" />
                  PDF
                </button>
              </div>
            </div>

            {/* Risk + Profit yan yana */}
            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
              <PublicRiskCard
                report={result.report}
                keyword={result.keyword}
                marketplace={result.marketplace}
              />
              <PublicProfitCalculator compact />
            </div>

            {/* Ürün kanıt tablosu */}
            <PublicEvidenceTable
              jobId={result.jobId}
              keyword={result.keyword}
              marketplace={result.marketplace}
            />
          </div>
        )}

        {/* Kayıtlı aramalar + çoklu keyword */}
        {!activeJobId && (
          <div className="space-y-3">
            <PublicSavedSearches
              currentKeyword={result?.keyword}
              currentMarketplace={result?.marketplace}
              onSearch={(kw, mp) => {
                setKeyword(kw);
                setMarketplace(mp);
              }}
            />
            <PublicMultiKeyword
              onScanRequested={(kw, mp) => {
                setKeyword(kw);
                setMarketplace(mp);
              }}
            />
          </div>
        )}

        {/* History */}
        {history && history.length > 0 && !result && !activeJobId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-(--gm-muted)">
                <Clock className="mr-1.5 inline size-3" />
                Son Aramalar
              </p>
              <button
                type="button"
                onClick={() => refetchHistory()}
                className="text-(--gm-muted) hover:text-(--gm-text) transition-colors"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {history.slice(0, 8).map((item) => (
                <HistoryItem key={item.id} item={item} onClick={() => handleHistoryClick(item)} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !activeJobId && (!history || history.length === 0) && (
          <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface)/5 px-6 py-12 text-center space-y-3">
            <BarChart3 className="mx-auto size-10 text-(--gm-primary)/30" />
            <p className="font-display font-medium text-(--gm-text)">İlk analizinizi yapın</p>
            <p className="text-sm text-(--gm-muted) max-w-xs mx-auto">
              Bir keyword girerek Amazon pazarındaki rekabeti ve riski ölçün.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
