'use client';

import { useMemo, useState } from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DatabaseBackup,
  FileText,
  Play,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMarketTestRunMutation, useExecuteMarketTestRunMutation, useListMarketTestRunsQuery } from '@/integrations/hooks';
import {
  type MarketTestRunStatus,
} from '@/integrations/endpoints/admin/market_admin.endpoints';

const testSuites = [
  {
    title: 'Backend Market Modülleri',
    command: 'cd backend && bun test',
    status: 'Aktif',
    scope: 'market ve lead-machine repository/controller/service testleri',
    notes: 'Mock DB ile çalışır; dış servis ve gerçek veritabanı çağrısı yapmaz.',
  },
  {
    title: 'Admin API Sözleşmesi',
    command: 'cd admin_panel && bun test',
    status: 'Aktif',
    scope: 'market_admin RTK endpoint URL, method, params ve body mapping testleri',
    notes: 'Frontend ile backend endpoint sözleşmesinin bozulmasını yakalar.',
  },
  {
    title: 'Admin Ekran Smoke Testleri',
    command: 'cd admin_panel && bun test',
    status: 'Aktif',
    scope: 'dashboard, hedefler, leadler, sinyaller, Lead Machine ve dokümantasyon render kontrolü',
    notes: 'Hooklar mocklanır; ekrandaki temel metinler ve boş/dolu state yüzeyleri doğrulanır.',
  },
  {
    title: 'Tip Kontrolü',
    command: 'cd admin_panel && bun run typecheck',
    status: 'Aktif',
    scope: 'Next admin panel TypeScript kontrolü',
    notes: 'Bun test dosyaları tsconfig dışında tutulur; üretim kodu ayrıca kontrol edilir.',
  },
  {
    title: 'Production Build',
    command: 'cd admin_panel && bun run build',
    status: 'Aktif',
    scope: 'route üretimi, server/static sayfa derlemesi ve production bundle',
    notes: 'Google Fonts erişimi kapalı ortamlarda font indirme adımı buildi etkileyebilir.',
  },
];

const checklist = [
  'Test çalıştırmadan önce Market Pulse dış entegrasyon env değişkenlerini kontrol et.',
  'Gerçek DB kullanan integration test eklendiğinde önce snapshot veya yedek al.',
  'Başarısız testte önce ilgili route/API sözleşmesini, sonra veri adaptörünü kontrol et.',
  'Lead Machine işlerinde scraper, Oxylabs, AI provider ve SMTP ayarlarını ayrı ayrı doğrula.',
  'Build geçmeden deployment veya demo paylaşma.',
];

const runHistoryTemplate = [
  { label: 'Backend', value: '110 pass', tone: 'text-gm-success' },
  { label: 'Admin', value: '17 pass', tone: 'text-gm-success' },
  { label: 'Typecheck', value: 'Geçti', tone: 'text-gm-success' },
  { label: 'Build', value: 'Geçti', tone: 'text-gm-success' },
];

export default function MarketTestCenterPage() {
  const { data: runs = [], isFetching } = useListMarketTestRunsQuery({ limit: 20 });
  const [createRun, createRunState] = useCreateMarketTestRunMutation();
  const [executeRun, executeRunState] = useExecuteMarketTestRunMutation();
  const [selectedSuite, setSelectedSuite] = useState(testSuites[0]!.title);
  const [status, setStatus] = useState<MarketTestRunStatus>('passed');
  const [passCount, setPassCount] = useState('0');
  const [failCount, setFailCount] = useState('0');
  const [skipCount, setSkipCount] = useState('0');
  const [outputExcerpt, setOutputExcerpt] = useState('');
  const [riskNote, setRiskNote] = useState('');

  const selectedTestSuite = useMemo(
    () => testSuites.find((item) => item.title === selectedSuite) ?? testSuites[0]!,
    [selectedSuite],
  );

  const saveRun = async () => {
    try {
      await createRun({
        suite: selectedTestSuite.title.toLowerCase().replaceAll(' ', '_'),
        title: selectedTestSuite.title,
        command: selectedTestSuite.command,
        status,
        pass_count: Number(passCount) || 0,
        fail_count: Number(failCount) || 0,
        skip_count: Number(skipCount) || 0,
        output_excerpt: outputExcerpt.trim() || undefined,
        risk_note: riskNote.trim() || undefined,
      }).unwrap();
      setOutputExcerpt('');
      setRiskNote('');
      toast.success('Test sonucu kaydedildi.');
    } catch {
      toast.error('Test sonucu kaydedilemedi.');
    }
  };

  const autoRunTest = async () => {
    try {
      toast.info(`${selectedTestSuite.title} testleri çalıştırılıyor...`, { id: 'test-run' });
      const result = await executeRun({
        suite: selectedTestSuite.title.toLowerCase().replaceAll(' ', '_'),
        title: selectedTestSuite.title,
        command: selectedTestSuite.command,
      }).unwrap();
      
      toast.success(`${selectedTestSuite.title} testi tamamlandı! Durum: ${result.status}`, { id: 'test-run' });
    } catch (e: any) {
      toast.error('Test çalıştırılırken bir hata oluştu.', { id: 'test-run' });
    }
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">MarketPulse</span>
        </div>
        <div className="max-w-4xl space-y-4">
          <h1 className="font-serif text-4xl text-gm-text md:text-5xl">Test Merkezi</h1>
          <p className="font-serif text-base italic leading-7 text-gm-muted md:text-lg">
            Paspas admin panelindeki Test Merkezi mimarisinin Market Pulse’a uyarlanmış kalite kapısıdır. Komutlar manuel çalıştırılır,
            sonuçlar bu sayfadaki kapsam ve risk notlarına göre değerlendirilir.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {runHistoryTemplate.map((item) => (
          <Card key={item.label} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-gm-muted">{item.label}</p>
              <p className={`mt-2 font-serif text-2xl ${item.tone}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="size-5 text-gm-gold" />
            <h2 className="font-serif text-2xl text-gm-text">Test Checklist Tablosu</h2>
          </div>
          <div className="grid gap-4">
            {testSuites.map((suite) => (
              <Card key={suite.title} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl text-gm-text">{suite.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gm-muted">{suite.scope}</p>
                    </div>
                    <Badge className="rounded-full bg-gm-success text-black hover:bg-gm-success">{suite.status}</Badge>
                  </div>
                  <code className="block rounded-xl border border-gm-border-soft bg-black/30 px-4 py-3 font-mono text-xs text-gm-gold">
                    {suite.command}
                  </code>
                  <div className="flex gap-2 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 text-sm leading-6 text-gm-muted">
                    <FileText className="mt-0.5 size-4 shrink-0 text-gm-gold" />
                    <p>{suite.notes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <DatabaseBackup className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Yedek Politikası</h2>
              </div>
              <p className="text-sm leading-6 text-gm-muted">
                Mevcut Market Pulse testleri izole çalışır. Gerçek DB veya dış servis kullanan test eklendiğinde Paspas’taki snapshot/restore
                yaklaşımı zorunlu hale getirilmeli ve test sonucu snapshot ID ile kaydedilmelidir.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Koşum Sırası</h2>
              </div>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="flex gap-2 text-sm leading-6 text-gm-muted">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-gm-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Play className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Manuel Sonuç Notu</h2>
              </div>
              <select
                value={selectedSuite}
                onChange={(event) => setSelectedSuite(event.target.value)}
                className="h-10 w-full rounded-md border border-gm-border-soft bg-gm-bg-deep px-3 text-sm text-gm-text"
              >
                {testSuites.map((suite) => (
                  <option key={suite.title} value={suite.title}>{suite.title}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MarketTestRunStatus)}
                className="h-10 w-full rounded-md border border-gm-border-soft bg-gm-bg-deep px-3 text-sm text-gm-text"
              >
                <option value="passed">Geçti</option>
                <option value="failed">Hatalı</option>
                <option value="expected_failing">Beklenen hata</option>
                <option value="skipped">Atlandı</option>
                <option value="not_run">Çalışmadı</option>
              </select>
              <div className="grid grid-cols-3 gap-2">
                <Input value={passCount} onChange={(event) => setPassCount(event.target.value)} placeholder="Pass" />
                <Input value={failCount} onChange={(event) => setFailCount(event.target.value)} placeholder="Fail" />
                <Input value={skipCount} onChange={(event) => setSkipCount(event.target.value)} placeholder="Skip" />
              </div>
              <Textarea
                value={outputExcerpt}
                onChange={(event) => setOutputExcerpt(event.target.value)}
                placeholder="Test çıktısı özeti"
                className="min-h-24"
              />
              <Textarea
                value={riskNote}
                onChange={(event) => setRiskNote(event.target.value)}
                placeholder="Risk veya aksiyon notu"
                className="min-h-20"
              />
              <div className="flex gap-3">
                <Button type="button" onClick={saveRun} disabled={createRunState.isLoading || executeRunState.isLoading} className="w-1/2 gap-2" variant="outline">
                  <CheckCircle2 className="size-4" />
                  Manuel kaydet
                </Button>
                <Button type="button" onClick={autoRunTest} disabled={createRunState.isLoading || executeRunState.isLoading} className="w-1/2 gap-2 bg-gm-gold text-black hover:bg-gm-gold-light">
                  <Play className="size-4" />
                  Otomatik Çalıştır
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Sonraki Mimari Adım</h2>
              </div>
              <p className="text-sm leading-6 text-gm-muted">
                Bu sayfanın sonraki sürümü Paspas Test Merkezi gibi test case, run history, manuel sonuç notu ve AI analiz kayıtlarını backend
                tablolarına yazmalıdır.
              </p>
              <Link
                href="/admin/market/developer-notes"
                className="inline-flex items-center gap-2 text-sm font-medium text-gm-gold hover:text-gm-text"
              >
                <Terminal className="size-4" />
                Yazılımcı notlarına git
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-gm-gold" />
                <h2 className="font-serif text-2xl text-gm-text">Sonuç Geçmişi</h2>
              </div>
              <p className="text-xs text-gm-muted">{isFetching ? 'Güncelleniyor' : `${runs.length} kayıt`}</p>
              <div className="space-y-3">
                {runs.length ? runs.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-lg text-gm-text">{run.title}</h3>
                      <Badge className={run.status === 'failed' ? 'bg-gm-error text-white' : 'bg-gm-success text-black'}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="mt-2 font-mono text-xs text-gm-muted">{run.command}</p>
                    <p className="mt-2 text-sm text-gm-muted">
                      pass {run.passCount} / fail {run.failCount} / skip {run.skipCount}
                    </p>
                    {run.outputExcerpt ? <p className="mt-2 text-sm leading-6 text-gm-muted">{run.outputExcerpt}</p> : null}
                  </div>
                )) : (
                  <p className="text-sm leading-6 text-gm-muted">Henüz kayıtlı test sonucu yok.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
