'use client';

import * as React from 'react';
import {
  ChevronDown,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateIcpProfileMutation,
  useDeleteIcpProfileMutation,
  useListIcpProfilesQuery,
  useUpdateIcpProfileMutation,
  type IcpDefinition,
  type IcpProfile,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

// ─── Option constants ─────────────────────────────────────────────────────────

const SECTOR_OPTIONS = [
  'Otomotiv Aksesuar',
  'Oto Bakım & Detay',
  'Taşıt Tekstili',
  'Mobilya & Dekorasyon',
  'Ev Tekstili',
  'Temizlik Ürünleri',
  'Ambalaj',
  'Endüstriyel Malzeme',
  'Hırdavat & El Aletleri',
  'Elektrik & Elektronik',
  'Yapı Malzemeleri',
  'Gıda & İçecek',
  'Kozmetik & Kişisel Bakım',
  'Spor & Outdoor',
  'Bahçe & Tarım',
];

const SUB_SECTOR_MAP: Record<string, string[]> = {
  'Otomotiv Aksesuar': ['Paspas', 'Kargo Havuzu', 'Koltuk Kılıfı', 'Direksiyon Kılıfı', 'Güneşlik'],
  'Oto Bakım & Detay': ['Detay Ürünleri', 'Cila & Pasta', 'Boya Koruma', 'İç Temizlik'],
  'Ev Tekstili': ['Halı & Kilim', 'Perde', 'Yorgan & Yastık', 'Havlu & Bornoz'],
  'Mobilya & Dekorasyon': ['Oturma Grubu', 'Yatak Odası', 'Aydınlatma', 'Duvar Dekorasyon'],
  'Temizlik Ürünleri': ['Yüzey Temizleyici', 'Kişisel Hijyen', 'Endüstriyel Temizlik'],
  'Ambalaj': ['Plastik Ambalaj', 'Karton & Kağıt', 'Fleksibil Ambalaj', 'Etiket & Bant'],
  'Endüstriyel Malzeme': ['Plastik Profil', 'Conta & Sızdırmazlık', 'Makine Parçası'],
};

const FIRM_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'distributor', label: 'Distribütör' },
  { value: 'importer', label: 'İthalatçı' },
  { value: 'wholesaler', label: 'Toptancı' },
  { value: 'manufacturer', label: 'Üretici' },
  { value: 'retailer', label: 'Perakende' },
  { value: 'e-commerce', label: 'E-ticaret' },
];

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'DE', label: 'DE · Almanya' },
  { code: 'AT', label: 'AT · Avusturya' },
  { code: 'CH', label: 'CH · İsviçre' },
  { code: 'NL', label: 'NL · Hollanda' },
  { code: 'BE', label: 'BE · Belçika' },
  { code: 'PL', label: 'PL · Polonya' },
  { code: 'CZ', label: 'CZ · Çekya' },
  { code: 'SK', label: 'SK · Slovakya' },
  { code: 'HU', label: 'HU · Macaristan' },
  { code: 'FR', label: 'FR · Fransa' },
  { code: 'IT', label: 'IT · İtalya' },
  { code: 'ES', label: 'ES · İspanya' },
  { code: 'SE', label: 'SE · İsveç' },
  { code: 'DK', label: 'DK · Danimarka' },
  { code: 'UK', label: 'UK · Birleşik Krallık' },
  { code: 'US', label: 'US · ABD' },
  { code: 'TR', label: 'TR · Türkiye' },
];

const EMPLOYEE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: '1–10', min: 1, max: 10 },
  { label: '11–50', min: 11, max: 50 },
  { label: '51–200', min: 51, max: 200 },
  { label: '201–500', min: 201, max: 500 },
  { label: '500+', min: 500, max: null },
];

const LEAD_CHANNEL_OPTIONS: { value: string; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'b2b', label: 'B2B Arama', icon: Store, desc: 'Web scraping · LinkedIn' },
  { value: 'fuar', label: 'Fuar Tarama', icon: MapPin, desc: '10times · fuar listeleri' },
  { value: 'amazon', label: 'Amazon', icon: Search, desc: 'Satıcı & kategori analizi' },
];

const CHANNEL_BADGE: Record<string, string> = {
  b2b: 'border-blue-400/30 bg-blue-500/10 text-blue-400',
  fuar: 'border-purple-400/30 bg-purple-500/10 text-purple-400',
  amazon: 'border-orange-400/30 bg-orange-500/10 text-orange-400',
};

const CHANNEL_LABEL: Record<string, string> = { b2b: 'B2B', fuar: 'Fuar', amazon: 'Amazon' };

const LABEL_CAPS = 'text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted';

// ─── TagPicker ────────────────────────────────────────────────────────────────

interface TagPickerProps {
  options?: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  optionLabel?: (opt: string) => string;
}

function TagPicker({ options = [], value, onChange, placeholder = 'Özel ekle…', optionLabel }: TagPickerProps) {
  const [input, setInput] = React.useState('');

  const toggle = (tag: string) =>
    onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag]);

  const addCustom = () => {
    const t = input.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
  };

  const customTags = value.filter((v) => !options.includes(v));

  return (
    <div className="space-y-3">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium transition-all',
                value.includes(opt)
                  ? 'border-gm-gold bg-gm-gold/15 text-gm-gold'
                  : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:border-gm-gold/40 hover:text-gm-text',
              )}
            >
              {optionLabel ? optionLabel(opt) : opt}
            </button>
          ))}
        </div>
      )}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-gm-gold/30 bg-gm-gold/10 px-3 py-1 text-[11px] font-medium text-gm-gold"
            >
              {tag}
              <button type="button" onClick={() => toggle(tag)} className="opacity-60 hover:opacity-100">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder={placeholder}
          className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/30 text-sm text-gm-text placeholder:text-gm-muted/60"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          disabled={!input.trim()}
          className="h-9 rounded-xl border-gm-border-soft bg-gm-surface/20 text-gm-text"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── EmployeePicker ───────────────────────────────────────────────────────────

function EmployeePicker({
  minValue,
  maxValue,
  onChange,
}: {
  minValue: number | null;
  maxValue: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EMPLOYEE_PRESETS.map((p) => {
        const active = p.min === minValue && p.max === maxValue;
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(active ? null : p.min, active ? null : p.max)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[11px] font-medium transition-all',
              active
                ? 'border-gm-gold bg-gm-gold/15 text-gm-gold'
                : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:border-gm-gold/40 hover:text-gm-text',
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── LeadChannelPicker ────────────────────────────────────────────────────────

function LeadChannelPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (ch: string) =>
    onChange(value.includes(ch) ? value.filter((v) => v !== ch) : [...value, ch]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {LEAD_CHANNEL_OPTIONS.map(({ value: ch, label, icon: Icon, desc }) => {
        const active = value.includes(ch);
        return (
          <button
            key={ch}
            type="button"
            onClick={() => toggle(ch)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all',
              active
                ? 'border-gm-gold bg-gm-gold/10 text-gm-gold shadow-[0_0_16px_rgba(var(--gm-gold-rgb),0.12)]'
                : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:border-gm-gold/30 hover:text-gm-text',
            )}
          >
            <Icon className="size-5" />
            <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
            <span className="text-[10px] opacity-70">{desc}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

type IcpFormState = {
  name: string;
  isActive: boolean;
  definition: IcpDefinition & {
    sectors: string[];
    sub_sectors: string[];
    firm_types: string[];
    geographies: string[];
    sales_types: string[];
    sales_channels: string[];
    exclude_countries: string[];
    exclude_patterns: string[];
    lead_channels: string[];
    price_segment: string;
    min_employees: number | null;
    max_employees: number | null;
    description: string;
  };
};

const EMPTY_FORM: IcpFormState = {
  name: '',
  isActive: true,
  definition: {
    sectors: [],
    sub_sectors: [],
    firm_types: [],
    geographies: [],
    sales_types: [],
    sales_channels: [],
    price_segment: 'mid',
    min_employees: null,
    max_employees: null,
    exclude_countries: [],
    exclude_patterns: [],
    lead_channels: [],
    description: '',
  },
};

function formFromProfile(profile?: IcpProfile | null): IcpFormState {
  if (!profile) return structuredClone(EMPTY_FORM);
  const d = profile.definition ?? {};
  return {
    name: profile.name,
    isActive: profile.is_active === 1,
    definition: {
      sectors: d.sectors ?? [],
      sub_sectors: d.sub_sectors ?? [],
      firm_types: d.firm_types ?? [],
      geographies: d.geographies ?? [],
      sales_types: d.sales_types ?? [],
      sales_channels: d.sales_channels ?? [],
      price_segment: d.price_segment ?? 'mid',
      min_employees: d.min_employees ?? null,
      max_employees: d.max_employees ?? null,
      exclude_countries: d.exclude_countries ?? [],
      exclude_patterns: d.exclude_patterns ?? [],
      lead_channels: d.lead_channels ?? [],
      description: d.description ?? '',
    },
  };
}

// ─── IcpDialog ────────────────────────────────────────────────────────────────

function IcpDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: IcpProfile | null;
}) {
  const [form, setForm] = React.useState<IcpFormState>(() => formFromProfile(profile));
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [createProfile, createState] = useCreateIcpProfileMutation();
  const [updateProfile, updateState] = useUpdateIcpProfileMutation();

  React.useEffect(() => {
    if (open) {
      setForm(formFromProfile(profile));
      setAdvancedOpen(false);
    }
  }, [open, profile]);

  const isBusy = createState.isLoading || updateState.isLoading;

  const setDef = <K extends keyof IcpFormState['definition']>(
    key: K,
    value: IcpFormState['definition'][K],
  ) => setForm((cur) => ({ ...cur, definition: { ...cur.definition, [key]: value } }));

  const subSectorOptions = React.useMemo(() => {
    const opts: string[] = [];
    form.definition.sectors.forEach((sec) => {
      (SUB_SECTOR_MAP[sec] ?? []).forEach((s) => { if (!opts.includes(s)) opts.push(s); });
    });
    return opts;
  }, [form.definition.sectors]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('ICP adı gerekli'); return; }
    try {
      const body = { name: form.name.trim(), is_active: form.isActive, definition: form.definition as IcpDefinition };
      if (profile) await updateProfile({ id: profile.id, body }).unwrap();
      else await createProfile(body).unwrap();
      toast.success(profile ? 'ICP güncellendi' : 'ICP oluşturuldu');
      onOpenChange(false);
    } catch {
      toast.error('ICP kaydedilemedi');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-gm-border-soft bg-gm-bg-deep text-gm-text sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-gm-text">
            {profile ? 'ICP Düzenle' : 'Yeni ICP Profili'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 pb-2">
          {/* Profil adı + aktif toggle */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label className={LABEL_CAPS}>Profil Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))}
                placeholder="Oto Aksesuar Distribütörü — Avrupa"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
              />
            </div>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-gm-border-soft bg-gm-surface/20 px-4">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((cur) => ({ ...cur, isActive: v }))}
                className="data-[state=checked]:bg-gm-gold"
              />
              <span className={LABEL_CAPS}>Aktif</span>
            </div>
          </div>

          {/* Lead kanalı */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>Lead Kanalı</Label>
            <p className="text-xs text-gm-muted">Hangi tarama kanalına yönelik? Çoklu seçilebilir.</p>
            <LeadChannelPicker
              value={form.definition.lead_channels}
              onChange={(v) => setDef('lead_channels', v)}
            />
          </div>

          {/* Sektörler */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>Sektörler</Label>
            <TagPicker
              options={SECTOR_OPTIONS}
              value={form.definition.sectors}
              onChange={(v) => setDef('sectors', v)}
              placeholder="Özel sektör ekle…"
            />
          </div>

          {/* Alt sektörler */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>
              Alt Sektörler
              {subSectorOptions.length > 0 && (
                <span className="ml-2 font-normal normal-case tracking-normal text-gm-muted">
                  — seçili sektörlerden otomatik öneriler
                </span>
              )}
            </Label>
            <TagPicker
              options={subSectorOptions}
              value={form.definition.sub_sectors}
              onChange={(v) => setDef('sub_sectors', v)}
              placeholder="Özel alt sektör ekle…"
            />
          </div>

          {/* Firma tipi */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>Firma Tipi</Label>
            <div className="flex flex-wrap gap-2">
              {FIRM_TYPE_OPTIONS.map(({ value, label }) => {
                const active = form.definition.firm_types.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setDef(
                        'firm_types',
                        active
                          ? form.definition.firm_types.filter((v) => v !== value)
                          : [...form.definition.firm_types, value],
                      )
                    }
                    className={cn(
                      'rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all',
                      active
                        ? 'border-gm-gold bg-gm-gold/15 text-gm-gold'
                        : 'border-gm-border-soft bg-gm-surface/20 text-gm-muted hover:border-gm-gold/40 hover:text-gm-text',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hedef ülkeler */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>Hedef Ülkeler</Label>
            <TagPicker
              options={COUNTRY_OPTIONS.map((c) => c.code)}
              value={form.definition.geographies}
              onChange={(v) => setDef('geographies', v)}
              placeholder="Özel ülke kodu (örn: RO)"
              optionLabel={(code) => code}
            />
            {form.definition.geographies.length > 0 && (
              <p className="text-xs text-gm-muted">
                Seçili:{' '}
                {form.definition.geographies
                  .map((c) => COUNTRY_OPTIONS.find((o) => o.code === c)?.label ?? c)
                  .join(' · ')}
              </p>
            )}
          </div>

          {/* Firma büyüklüğü */}
          <div className="space-y-3">
            <Label className={LABEL_CAPS}>Firma Büyüklüğü (Çalışan Sayısı)</Label>
            <EmployeePicker
              minValue={form.definition.min_employees}
              maxValue={form.definition.max_employees}
              onChange={(min, max) => {
                setDef('min_employees', min);
                setDef('max_employees', max);
              }}
            />
          </div>

          {/* Gelişmiş seçenekler */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-gm-border-soft bg-gm-surface/10 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gm-muted hover:border-gm-gold/30 hover:text-gm-text transition-colors"
              >
                <ChevronDown className={cn('size-4 transition-transform', advancedOpen && 'rotate-180')} />
                Gelişmiş Seçenekler
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
              <div className="space-y-3">
                <Label className={LABEL_CAPS}>Satış Tipleri</Label>
                <TagPicker
                  options={['B2B', 'B2C', 'D2C', 'B2G']}
                  value={form.definition.sales_types}
                  onChange={(v) => setDef('sales_types', v)}
                  placeholder="Özel tip…"
                />
              </div>
              <div className="space-y-3">
                <Label className={LABEL_CAPS}>Satış Kanalları</Label>
                <TagPicker
                  options={['amazon', 'ebay', 'kendi sitesi', 'toptan', 'mağaza']}
                  value={form.definition.sales_channels}
                  onChange={(v) => setDef('sales_channels', v)}
                  placeholder="Özel kanal…"
                />
              </div>
              <div className="space-y-2">
                <Label className={LABEL_CAPS}>Fiyat Segmenti</Label>
                <Select
                  value={form.definition.price_segment}
                  onValueChange={(v) => setDef('price_segment', v)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                    <SelectItem value="low">Düşük (Low)</SelectItem>
                    <SelectItem value="mid">Orta (Mid)</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className={LABEL_CAPS}>Hariç Ülkeler</Label>
                <TagPicker
                  options={['CN', 'RU', 'US']}
                  value={form.definition.exclude_countries}
                  onChange={(v) => setDef('exclude_countries', v)}
                  placeholder="Ülke kodu…"
                />
              </div>
              <div className="space-y-3">
                <Label className={LABEL_CAPS}>Hariç Anahtar Kelimeler</Label>
                <TagPicker
                  options={['rental', 'used parts', 'wholesale only']}
                  value={form.definition.exclude_patterns}
                  onChange={(v) => setDef('exclude_patterns', v)}
                  placeholder="Kelime / pattern…"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label className={LABEL_CAPS}>
              Açıklama{' '}
              <span className="font-normal normal-case tracking-normal text-gm-muted">(opsiyonel)</span>
            </Label>
            <Textarea
              value={form.definition.description}
              onChange={(e) => setDef('description', e.target.value)}
              placeholder="Bu ICP'nin amacını veya notlarını kısaca açıklayın…"
              rows={3}
              className="rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text placeholder:text-gm-muted/60"
            />
          </div>

          {/* ─── v3 Gelişmiş Ayarlar ─── */}
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-surface/20 px-4 py-3 text-left hover:bg-gm-surface/40">
              <span className="font-bold uppercase tracking-widest text-xs text-gm-primary-light">
                🔧 v3 Gelişmiş Eşleşme + Skor Ayarları
              </span>
              <ChevronDown className="size-4 text-gm-muted transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">

              {/* Strong / Weak match sektörler */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Güçlü eşleşme sektörleri
                    <span className="ml-2 font-normal normal-case text-[10px] tracking-normal text-gm-muted">
                      Match skoru +0.5 (virgülle ayır)
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.strong_match_sectors ?? []).join(', ')}
                    onChange={(e) => setDef('strong_match_sectors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="floor mats, car mats, rubber mats, boot liners"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Zayıf eşleşme sektörleri
                    <span className="ml-2 font-normal normal-case text-[10px] tracking-normal text-gm-muted">
                      Match skoru +0.1 (virgülle ayır)
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.weak_match_sectors ?? []).join(', ')}
                    onChange={(e) => setDef('weak_match_sectors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="automotive accessories, car care, interior accessories"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
              </div>

              {/* Domain + Brand exclude */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Domain substring eleme
                    <span className="ml-2 font-normal normal-case text-[10px] tracking-normal text-gm-muted">
                      Mail/website'de geçerse aday elenir
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.exclude_domain_substrings ?? []).join(', ')}
                    onChange={(e) => setDef('exclude_domain_substrings', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="cooling, battery, lighting, brake, filter"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    OEM/Brand eleme
                    <span className="ml-2 font-normal normal-case text-[10px] tracking-normal text-gm-muted">
                      Firma adında geçerse aday elenir
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.exclude_brands ?? []).join(', ')}
                    onChange={(e) => setDef('exclude_brands', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="bosch, zf, schaeffler, continental, thyssenkrupp"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
              </div>

              {/* Pozitif / Negatif sinyaller */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Pozitif sinyaller (skor +)
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.positive_signals ?? []).join(', ')}
                    onChange={(e) => setDef('positive_signals', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="private label, ODM, wholesale, distributor"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Negatif sinyaller (skor −)
                  </Label>
                  <Textarea
                    rows={2}
                    value={(form.definition.negative_signals ?? []).join(', ')}
                    onChange={(e) => setDef('negative_signals', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="in-house production, single OEM contract"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-xs font-mono text-gm-text"
                  />
                </div>
              </div>

              {/* Skor eşikleri */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>Min skor (aday kabul)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.definition.min_lead_score_for_candidate ?? 5.5}
                    onChange={(e) => setDef('min_lead_score_for_candidate', Number(e.target.value))}
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>Auto-approve skor eşiği</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.definition.auto_approve_threshold ?? 7.0}
                    onChange={(e) => setDef('auto_approve_threshold', Number(e.target.value))}
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>Komşu stand bonusu</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.definition.neighbor_bonus ?? 0.5}
                    onChange={(e) => setDef('neighbor_bonus', Number(e.target.value))}
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
                  />
                </div>
              </div>

              {/* Öncelikli coğrafyalar */}
              <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>
                    Öncelikli ülkeler (ISO 2)
                    <span className="ml-2 font-normal normal-case text-[10px] tracking-normal text-gm-muted">
                      Pilot pazarlar (virgülle ayır)
                    </span>
                  </Label>
                  <Input
                    value={(form.definition.priority_geographies ?? []).join(', ')}
                    onChange={(e) => setDef('priority_geographies', e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))}
                    placeholder="DE, POL, AT, NL, FR"
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-gm-text font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={LABEL_CAPS}>Öncelik skor boost</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.definition.priority_boost ?? 1.0}
                    onChange={(e) => setDef('priority_boost', Number(e.target.value))}
                    className="rounded-xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
                  />
                </div>
              </div>

              {/* Raw JSON editor — uzman kullanıcı için */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-dashed border-gm-border-soft bg-gm-surface/10 px-3 py-2 text-left hover:bg-gm-surface/30">
                  <span className="font-bold uppercase tracking-widest text-[10px] text-gm-muted">
                    🛠️ Raw JSON (business_model_signals, scoring_weights, vs.)
                  </span>
                  <ChevronDown className="size-3 text-gm-muted" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Textarea
                    rows={12}
                    value={JSON.stringify(form.definition, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (parsed && typeof parsed === 'object') {
                          setForm((cur) => ({ ...cur, definition: parsed }));
                        }
                      } catch {
                        // sessizce devam — kullanıcı henüz yazıyor
                      }
                    }}
                    className="rounded-xl border-gm-border-soft bg-gm-bg/40 text-xs font-mono text-gm-text"
                  />
                  <p className="mt-1 text-[10px] text-gm-muted/80">
                    ⚠️ Geçersiz JSON yazılırsa form alanlarına yansımaz. Form alanlarındaki değişiklikler buraya yansır.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface"
            >
              <X className="mr-2 size-4" />
              Vazgeç
            </Button>
            <Button
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-full bg-gm-gold px-6 text-black hover:bg-gm-gold-light"
            >
              <Save className="mr-2 size-4" />
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function IcpProfilesPanel() {
  const { data, isLoading, isFetching, refetch } = useListIcpProfilesQuery();
  const [deleteProfile, deleteState] = useDeleteIcpProfileMutation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editProfile, setEditProfile] = React.useState<IcpProfile | null>(null);

  const handleDelete = async (profile: IcpProfile) => {
    if (!confirm(`"${profile.name}" silinsin mi?`)) return;
    try {
      await deleteProfile(profile.id).unwrap();
      toast.success('ICP silindi');
    } catch {
      toast.error('ICP silinemedi; aktif job bağlantısı olabilir');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">ICP Profilleri</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            B2B, fuar ve Amazon aramalarında kullanılacak ideal müşteri profillerini yönetin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
          >
            <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditProfile(null); setDialogOpen(true); }}
            className="h-12 rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
          >
            <Plus className="mr-2 size-4" />
            Yeni ICP
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-20 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : data?.length ? (
          data.map((profile) => {
            const d = profile.definition ?? {};
            const channels: string[] = d.lead_channels ?? [];
            return (
              <Card
                key={profile.id}
                className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60 shadow-xl"
              >
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full text-[9px] font-bold uppercase tracking-widest',
                            profile.is_active === 1
                              ? 'border-gm-success/30 bg-gm-success/10 text-gm-success'
                              : 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted',
                          )}
                        >
                          {profile.is_active === 1 ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {channels.map((ch) => (
                          <Badge
                            key={ch}
                            variant="outline"
                            className={cn(
                              'rounded-full text-[9px] font-bold uppercase tracking-widest',
                              CHANNEL_BADGE[ch] ?? 'border-gm-border-soft bg-gm-surface/20 text-gm-muted',
                            )}
                          >
                            {CHANNEL_LABEL[ch] ?? ch}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="font-serif text-2xl text-gm-text">{profile.name}</h2>
                      {d.description && (
                        <p className="text-sm italic text-gm-muted">{d.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditProfile(profile); setDialogOpen(true); }}
                        className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface"
                      >
                        <Pencil className="mr-2 size-4" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteState.isLoading}
                        onClick={() => handleDelete(profile)}
                        className="rounded-full border-gm-error/30 bg-gm-error/10 text-gm-error hover:bg-gm-error hover:text-black"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Sil
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {(
                      [
                        ['Sektör', d.sectors],
                        ['Firma Tipi', d.firm_types],
                        ['Ülke', d.geographies],
                        ['Satış Kanalı', d.sales_channels],
                      ] as [string, string[] | undefined][]
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4"
                      >
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                          {label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(value ?? []).slice(0, 5).map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-gm-bg-deep/70 px-2 py-1 text-[10px] text-gm-muted"
                            >
                              {item}
                            </span>
                          ))}
                          {(value ?? []).length === 0 && (
                            <span className="text-[10px] italic text-gm-muted/50">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <SlidersHorizontal className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Henüz ICP profili yok.</div>
              <p className="text-sm text-gm-muted/70 max-w-xs">
                "Yeni ICP" butonu ile ideal müşteri profilinizi oluşturun.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <IcpDialog open={dialogOpen} onOpenChange={setDialogOpen} profile={editProfile} />
    </div>
  );
}
