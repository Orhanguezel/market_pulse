'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CalendarDays, MapPin, Play, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useListIcpProfilesQuery,
  useStartAmazonScanMutation,
  useStartB2bJobMutation,
  useStartFairJobMutation,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

type Source = 'b2b' | 'fair' | 'amazon';

const SOURCES: { value: Source; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'b2b',
    label: 'B2B Dizin',
    description: 'Google Maps, Europages ve TOBB üzerinden distribütör / ithalatçı firmalar',
    icon: <Building2 className="size-8" />,
    color: 'border-blue-400/40 bg-blue-400/5 hover:border-blue-400/60 hover:bg-blue-400/10 data-[active=true]:border-blue-400 data-[active=true]:bg-blue-400/15',
  },
  {
    value: 'fair',
    label: 'Fuar',
    description: 'Automechanika, Equip Auto ve benzeri fuar katılımcı listelerinden lead çıkar',
    icon: <CalendarDays className="size-8" />,
    color: 'border-purple-400/40 bg-purple-400/5 hover:border-purple-400/60 hover:bg-purple-400/10 data-[active=true]:border-purple-400 data-[active=true]:bg-purple-400/15',
  },
  {
    value: 'amazon',
    label: 'Amazon',
    description: 'Belirli keyword ile satıcı tara — rakip analizi ve potansiyel müşteri adayı',
    icon: <ShoppingCart className="size-8" />,
    color: 'border-orange-400/40 bg-orange-400/5 hover:border-orange-400/60 hover:bg-orange-400/10 data-[active=true]:border-orange-400 data-[active=true]:bg-orange-400/15',
  },
];

const B2B_SOURCES = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'europages', label: 'Europages' },
  { value: 'tobb', label: 'TOBB' },
];
const COUNTRIES = ['DE', 'AT', 'NL', 'PL', 'CZ', 'FR', 'IT', 'ES', 'TR'];
const MARKETPLACES = [
  { value: 'de', label: 'Amazon DE' },
  { value: 'com', label: 'Amazon US' },
  { value: 'co.uk', label: 'Amazon UK' },
  { value: 'fr', label: 'Amazon FR' },
  { value: 'it', label: 'Amazon IT' },
];

export default function LeadTaramaPanel() {
  const router = useRouter();
  const { data: icps } = useListIcpProfilesQuery();
  const [startB2b, b2bState] = useStartB2bJobMutation();
  const [startFair, fairState] = useStartFairJobMutation();
  const [startAmazon, amazonState] = useStartAmazonScanMutation();

  const [source, setSource] = React.useState<Source | null>(null);
  const [icpId, setIcpId] = React.useState('');

  // B2B fields
  const [b2bSource, setB2bSource] = React.useState('google_maps');
  const [b2bQuery, setB2bQuery] = React.useState('automotive accessories distributor');
  const [b2bCountry, setB2bCountry] = React.useState('DE');
  const [b2bLimit, setB2bLimit] = React.useState(25);

  // Fair fields
  const [fairName, setFairName] = React.useState('Automechanika Frankfurt');
  const [fairUrl, setFairUrl] = React.useState('');
  const [fairDate, setFairDate] = React.useState('');

  // Amazon fields
  const [keyword, setKeyword] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('de');
  const [amazonLimit, setAmazonLimit] = React.useState(20);

  // When ICP is selected, pre-fill search query hints
  React.useEffect(() => {
    if (!icpId || !icps) return;
    const icp = icps.find((p) => p.id === icpId);
    if (!icp) return;
    const def = icp.definition;
    if (source === 'b2b' && def.sectors?.length) {
      setB2bQuery(def.sectors.slice(0, 2).join(' ') + ' distributor');
    }
    if (source === 'amazon' && def.sectors?.length) {
      setKeyword(def.sectors[0] ?? '');
    }
  }, [icpId, icps, source]);

  React.useEffect(() => {
    if (!icpId && icps?.[0]?.id) setIcpId(icps[0].id);
  }, [icpId, icps]);

  const isBusy = b2bState.isLoading || fairState.isLoading || amazonState.isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) { toast.error('Kaynak seçimi gerekli'); return; }

    try {
      if (source === 'b2b') {
        if (!icpId) { toast.error('ICP seçimi gerekli'); return; }
        const job = await startB2b({ icp_id: icpId, source: b2bSource, search_query: b2bQuery, country: b2bCountry, limit: b2bLimit }).unwrap();
        toast.success('B2B araması başladı');
        router.push(`/admin/market/lead-machine/candidates?channel=b2b_directory&job_id=${job.id}`);
      } else if (source === 'fair') {
        if (!fairName.trim() || !fairUrl.trim()) { toast.error('Fuar adı ve URL gerekli'); return; }
        const job = await startFair({ fair_name: fairName, fair_url: fairUrl, fair_date: fairDate || undefined, icp_id: icpId || undefined }).unwrap();
        toast.success('Fuar taraması başladı');
        router.push(`/admin/market/lead-machine/candidates?channel=trade_fair&job_id=${job.id}`);
      } else if (source === 'amazon') {
        if (!keyword.trim()) { toast.error('Keyword gerekli'); return; }
        const job = await startAmazon({ keyword: keyword.trim(), marketplace, limit: amazonLimit }).unwrap();
        toast.success('Amazon taraması başladı');
        router.push(`/admin/market/lead-machine/amazon?job_id=${job.id}`);
      }
    } catch {
      toast.error('Tarama başlatılamadı');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
        </div>
        <h1 className="font-serif text-4xl text-gm-text">Lead Tarama</h1>
        <p className="max-w-xl font-serif text-sm italic text-gm-muted">
          Kanal seç, ICP profilini belirle ve taramayı başlat.
        </p>
      </div>

      {/* Step 1 — Kaynak Seçimi */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Adım 1 — Kaynak Seçin</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              data-active={source === s.value}
              onClick={() => setSource(s.value)}
              className={cn(
                'rounded-[24px] border-2 p-6 text-left transition-all duration-200',
                s.color,
              )}
            >
              <div className="mb-3 text-gm-text/70">{s.icon}</div>
              <div className="font-serif text-lg text-gm-text mb-1">{s.label}</div>
              <div className="text-xs leading-5 text-gm-muted">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {source && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 2 — ICP Seçimi */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Adım 2 — ICP Profili</p>
            <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
              <CardContent className="p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(icps ?? []).map((icp) => (
                    <button
                      key={icp.id}
                      type="button"
                      onClick={() => setIcpId(icp.id)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all text-sm',
                        icpId === icp.id
                          ? 'border-gm-gold bg-gm-gold/10 text-gm-text'
                          : 'border-gm-border-soft bg-gm-surface/10 text-gm-muted hover:border-gm-gold/40 hover:text-gm-text',
                      )}
                    >
                      <div className="font-medium mb-1">{icp.name}</div>
                      {icp.definition.sectors?.length ? (
                        <div className="text-[10px] text-gm-muted/70">{icp.definition.sectors.slice(0, 3).join(', ')}</div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 3 — Kaynağa Göre Form */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Adım 3 — Tarama Parametreleri</p>
            <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
              <CardContent className="space-y-5 p-6">

                {source === 'b2b' && (
                  <div className="grid gap-4 lg:grid-cols-[1fr_200px_160px_auto] lg:items-end">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Arama Terimi</Label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
                        <Input value={b2bQuery} onChange={(e) => setB2bQuery(e.target.value)}
                          className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kaynak</Label>
                      <Select value={b2bSource} onValueChange={setB2bSource}>
                        <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                          {B2B_SOURCES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Ülke</Label>
                      <Select value={b2bCountry} onValueChange={setB2bCountry}>
                        <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Limit</Label>
                      <Input type="number" min={1} max={100} value={b2bLimit}
                        onChange={(e) => setB2bLimit(Number(e.target.value))}
                        className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text w-24" />
                    </div>
                  </div>
                )}

                {source === 'fair' && (
                  <div className="grid gap-4 lg:grid-cols-[1fr_200px_auto] lg:items-end">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Fuar Exhibitor URL</Label>
                      <Input value={fairUrl} onChange={(e) => setFairUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Fuar Adı</Label>
                      <Input value={fairName} onChange={(e) => setFairName(e.target.value)}
                        className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Tarih</Label>
                      <Input type="date" value={fairDate} onChange={(e) => setFairDate(e.target.value)}
                        className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
                    </div>
                  </div>
                )}

                {source === 'amazon' && (
                  <div className="grid gap-4 lg:grid-cols-[1fr_200px_120px_auto] lg:items-end">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Keyword</Label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
                        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)}
                          placeholder="floor mats" className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Marketplace</Label>
                      <Select value={marketplace} onValueChange={setMarketplace}>
                        <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                          {MARKETPLACES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Limit</Label>
                      <Input type="number" min={1} max={100} value={amazonLimit}
                        onChange={(e) => setAmazonLimit(Number(e.target.value))}
                        className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
                    </div>
                    <div>
                      <div className="h-7" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="h-12 rounded-full bg-gm-gold px-10 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
                  >
                    <Play className="mr-2 size-4" />
                    Taramayı Başlat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}

      {!source && (
        <div className="flex items-center justify-center rounded-[28px] border border-dashed border-gm-border-soft py-20 text-center">
          <div className="space-y-2">
            <MapPin className="mx-auto size-10 text-gm-gold/30" />
            <p className="font-serif text-lg italic text-gm-muted">Başlamak için bir kaynak seçin.</p>
          </div>
        </div>
      )}
    </div>
  );
}
