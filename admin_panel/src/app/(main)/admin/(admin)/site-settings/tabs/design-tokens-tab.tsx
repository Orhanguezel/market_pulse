'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save, Palette, Eye, Layout, Type, MousePointer2, Box, Info } from 'lucide-react';

import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type TokenForm = {
  version: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  branding: Record<string, string>;
};

type ThemePreset = {
  id: string;
  label: string;
  description: string;
  preview: { primary: string; bg: string; text: string; accent: string };
  tokens: TokenForm;
};

/** Tasarim tokenlari sekmesi — form varsayilani (MarketPulse yesil). */
const DEFAULTS: TokenForm = {
  version: '2',
  colors: {
    brand_primary: '#16a34a',
    brand_primary_dark: '#15803d',
    brand_primary_light: '#22c55e',
    brand_secondary: '#15803d',
    brand_accent: '#854d0e',
    bg_base: '#f7fee7',
    bg_deep: '#ecfccb',
    bg_surface: '#FFFFFF',
    bg_surface_high: '#f0fdf4',
    text_primary: '#14532d',
    text_secondary: '#365314',
    text_muted: '#64748b',
    border: 'rgba(22,101,52,0.22)',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
  },
  typography: {
    font_display: "var(--font-inter), system-ui, sans-serif",
    font_serif: 'Georgia, serif',
    font_sans: "var(--font-inter), system-ui, sans-serif",
    font_mono: 'ui-monospace, monospace',
    base_size: '16px',
  },
  radius: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '9999px' },
  shadows: {
    soft: '0 2px 20px rgba(22,163,74,0.08)',
    card: '0 8px 40px rgba(22,163,74,0.12)',
    glow_primary: '0 0 60px rgba(22,163,74,0.18)',
    glow_gold: '0 0 30px rgba(22,163,74,0.14)',
  },
  branding: {
    app_name:
      process.env.NEXT_PUBLIC_SITE_NAME?.trim() ||
      process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
      'Platform',
    tagline: 'Ürün ve içerik deneyiminizi tek yerden yönetin.',
    tagline_en: 'Manage your product experience from one place.',
    logo_url: '',
    favicon_url: '',
    theme_color: '#15803d',
  },
};

function ColorRow({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-border/30 hover:border-[#16a34a]/30 transition-all">
      <div className="relative group">
        <div className="w-12 h-12 rounded-xl border border-border/50 overflow-hidden shadow-inner" style={{ backgroundColor: value }} />
        {isHex && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 bg-transparent border-none p-0 font-mono text-xs focus-visible:ring-0"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function PreviewCard({ form }: { form: TokenForm }) {
  return (
    <Card className="bg-[#f7fee7] border-[#16a34a]/20 rounded-[32px] overflow-hidden p-8 shadow-[0_20px_50px_rgba(22,101,52,0.12)]">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-px bg-[#16a34a]" />
          <span className="text-[#16a34a] font-bold text-[9px] tracking-[0.3em] uppercase" style={{ fontFamily: form.typography.font_sans }}>Önizleme</span>
        </div>
        <h3 className="text-3xl text-[#14532d]" style={{ fontFamily: form.typography.font_display }}>{form.branding.app_name}</h3>
        <p className="text-lg text-[#4A4238] italic leading-relaxed" style={{ fontFamily: form.typography.font_serif }}>
          "{form.branding.tagline}"
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button style={{ backgroundColor: form.colors.brand_primary, color: '#ecfdf5', borderRadius: form.radius.pill, fontFamily: form.typography.font_sans }} className="px-8 font-bold tracking-widest uppercase text-[10px] border-none shadow-[0_10px_20px_rgba(22,163,74,0.2)] hover:scale-105 transition-transform">
            Randevu Al
          </Button>
          <Button variant="outline" style={{ borderColor: form.colors.brand_primary, color: '#14532d', borderRadius: form.radius.pill, fontFamily: form.typography.font_sans }} className="px-8 font-bold tracking-widest uppercase text-[10px] bg-transparent hover:bg-[#16a34a]/5 transition-colors">
            Profil
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ThemePresetsSection({
  busy,
  onApplied,
}: {
  busy: boolean;
  onApplied: (tokens: TokenForm) => void;
}) {
  const { data: presetsRow, isLoading: lp } = useGetSiteSettingAdminByKeyQuery('theme_presets');
  const { data: activeRow, isLoading: la, refetch: refetchActive } =
    useGetSiteSettingAdminByKeyQuery('active_theme_preset');
  const [updateSetting] = useUpdateSiteSettingAdminMutation();
  const [applyingId, setApplyingId] = React.useState<string | null>(null);

  const presets = React.useMemo<ThemePreset[]>(() => {
    if (!presetsRow?.value) return [];
    try {
      const raw =
        typeof presetsRow.value === 'string' ? JSON.parse(presetsRow.value) : presetsRow.value;
      return Array.isArray(raw) ? (raw as ThemePreset[]) : [];
    } catch {
      return [];
    }
  }, [presetsRow?.value]);

  const activeId = typeof activeRow?.value === 'string' ? activeRow.value.trim() : '';
  const activeLabel = presets.find((p) => p.id === activeId)?.label;

  const apply = async (preset: ThemePreset) => {
    setApplyingId(preset.id);
    try {
      await updateSetting({ key: 'active_theme_preset', value: preset.id, locale: '*' }).unwrap();
      await updateSetting({
        key: 'design_tokens',
        value: JSON.stringify(preset.tokens),
        locale: '*',
      }).unwrap();
      onApplied(preset.tokens);
      await refetchActive();

      // Auto-purge frontend cache so theme change is visible immediately.
      // Best-effort: don't fail the apply if revalidation errors out.
      let revalidated = false;
      try {
        const res = await fetch('/api/revalidate-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        });
        revalidated = res.ok;
      } catch {
        revalidated = false;
      }

      toast.success(
        revalidated
          ? `"${preset.label}" teması uygulandı ve frontend cache temizlendi.`
          : `"${preset.label}" teması uygulandı (cache 5 dk içinde otomatik yenilenecek).`,
      );
    } catch {
      toast.error('Tema uygulanırken hata oluştu.');
    } finally {
      setApplyingId(null);
    }
  };

  if (lp || la) return null;
  if (presets.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center text-[#16a34a]">
          <Layout size={20} />
        </div>
        <div>
          <h4 className="font-serif text-xl">Tema Şablonları</h4>
          <p className="text-xs text-muted-foreground italic">
            Hazır tema paletlerinden birini uygulayın. Aktif şablon:{' '}
            <span className="font-semibold text-foreground not-italic">{activeLabel || '—'}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {presets.map((p) => {
          const isActive = p.id === activeId;
          const isLoading = applyingId === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                'group relative overflow-hidden rounded-3xl p-0 transition-all border',
                isActive
                  ? 'border-[#16a34a] shadow-[0_0_0_4px_rgba(22,163,74,0.15)]'
                  : 'border-border/40 hover:border-[#16a34a]/40',
              )}
            >
              <div className="h-28 relative" style={{ backgroundColor: p.preview.bg }}>
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full shadow-sm"
                    style={{ backgroundColor: p.preview.primary }}
                  />
                  <div
                    className="w-9 h-9 rounded-full shadow-sm"
                    style={{ backgroundColor: p.preview.accent }}
                  />
                  <div
                    className="w-7 h-7 rounded-full shadow-sm"
                    style={{ backgroundColor: p.preview.text }}
                  />
                </div>
                {isActive && (
                  <Badge className="absolute top-3 right-3 bg-[#16a34a] text-[#ecfdf5] hover:bg-[#16a34a] text-[10px] tracking-widest uppercase">
                    Aktif
                  </Badge>
                )}
              </div>
              <CardContent className="p-5 space-y-3">
                <div>
                  <div className="font-serif text-base">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    {p.description}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isActive ? 'outline' : 'default'}
                  disabled={busy || isLoading || isActive}
                  onClick={() => apply(p)}
                  className={cn(
                    'w-full rounded-full text-[10px] font-bold tracking-widest uppercase h-9',
                    !isActive && 'bg-[#16a34a] text-[#ecfdf5] hover:bg-[#16a34a]/90',
                  )}
                >
                  {isLoading ? 'Uygulanıyor...' : isActive ? 'Şu an aktif' : 'Bu Temayı Uygula'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Separator className="bg-[#16a34a]/10 mt-2" />
    </section>
  );
}

export const DesignTokensTab: React.FC = () => {
  const { data: settingRow, isLoading, isFetching, refetch } = useGetSiteSettingAdminByKeyQuery('design_tokens');
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<TokenForm>(DEFAULTS);

  React.useEffect(() => {
    if (settingRow?.value) {
      const val = typeof settingRow.value === 'string' ? JSON.parse(settingRow.value) : settingRow.value;
      setForm(prev => ({ ...prev, ...val }));
    }
  }, [settingRow?.value]);

  const handleSave = async () => {
    try {
      await updateSetting({ key: 'design_tokens', value: JSON.stringify(form), locale: '*' }).unwrap();
      toast.success('Tasarım tokenları başarıyla güncellendi.');
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    }
  };

  const busy = isLoading || isFetching || isSaving;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#16a34a]" />
            <span className="text-[#16a34a] font-bold text-[10px] tracking-[0.2em] uppercase">Görsel Kimlik</span>
          </div>
          <h2 className="font-serif text-3xl text-foreground">Design Token Editörü</h2>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Uygulamanın renk paleti, tipografi ve stil kurallarını gerçek zamanlı yönetin.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={busy} className="rounded-full border-border/40 px-6 h-11">
            <RefreshCcw className={cn("mr-2 size-4", busy && "animate-spin")} />
            Yenile
          </Button>
          <Button onClick={handleSave} disabled={busy} className="bg-[#16a34a] text-[#ecfdf5] hover:bg-[#16a34a]/90 rounded-full px-10 h-11 font-bold tracking-widest uppercase">
            <Save className="mr-2 size-4" />
            DEĞİŞİKLİKLERİ KAYDET
          </Button>
        </div>
      </div>

      <ThemePresetsSection
        busy={busy}
        onApplied={(tokens) => setForm((prev) => ({ ...prev, ...tokens }))}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left: Editor */}
        <div className="xl:col-span-8 space-y-12">
          {/* Colors */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center text-[#16a34a]">
                <Palette size={20} />
              </div>
              <div>
                <h4 className="font-serif text-xl">Renk Paleti</h4>
                <p className="text-xs text-muted-foreground italic">Marka renkleri ve arayüz tonları.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(form.colors).map(([key, value]) => (
                <ColorRow key={key} label={key} value={value} onChange={v => setForm(p => ({ ...p, colors: { ...p.colors, [key]: v } }))} disabled={busy} />
              ))}
            </div>
          </section>

          <Separator className="bg-[#16a34a]/10" />

          {/* Typography */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#7B5EA7]/10 flex items-center justify-center text-[#7B5EA7]">
                <Type size={20} />
              </div>
              <div>
                <h4 className="font-serif text-xl">Tipografi</h4>
                <p className="text-xs text-muted-foreground italic">Font aileleri ve temel metin boyutları.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-muted/5 rounded-[32px] border border-border/30">
              {Object.entries(form.typography).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">{key}</Label>
                  <Input 
                    value={value} 
                    onChange={e => setForm(p => ({ ...p, typography: { ...p.typography, [key]: e.target.value } }))}
                    className="bg-muted/20 border-border/40 rounded-xl h-11 font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-[#16a34a]/10" />

          {/* Radius & Shadows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#4CAF6E]/10 flex items-center justify-center text-[#4CAF6E]">
                  <MousePointer2 size={20} />
                </div>
                <h4 className="font-serif text-xl">Köşe Yuvarlama</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(form.radius).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-2xl bg-muted/10 border border-border/30">
                    <Label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block mb-2">{key}</Label>
                    <Input value={value} onChange={e => setForm(p => ({ ...p, radius: { ...p.radius, [key]: e.target.value } }))} className="bg-transparent border-none p-0 h-auto font-mono text-xs focus-visible:ring-0" />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#F0A030]/10 flex items-center justify-center text-[#F0A030]">
                  <Box size={20} />
                </div>
                <h4 className="font-serif text-xl">Gölgeler</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(form.shadows).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-2xl bg-muted/10 border border-border/30">
                    <Label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block mb-2">{key}</Label>
                    <Input value={value} onChange={e => setForm(p => ({ ...p, shadows: { ...p.shadows, [key]: e.target.value } }))} className="bg-transparent border-none p-0 h-auto font-mono text-xs focus-visible:ring-0" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="xl:col-span-4">
          <div className="sticky top-24 space-y-8">
            <div className="flex items-center gap-4 px-6">
              <Eye className="text-[#16a34a]" />
              <h4 className="font-serif text-xl italic">Canlı Önizleme</h4>
            </div>
            <PreviewCard form={form} />
            <div className="p-8 rounded-[32px] bg-[#16a34a]/5 border border-[#16a34a]/20 space-y-4">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-[#16a34a]" />
                <span className="text-[10px] font-bold text-[#16a34a] tracking-widest uppercase">Bilgi</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic font-serif">
                Yaptığınız değişiklikler frontend ve mobile uygulamalar tarafından anlık olarak (cache süresi sonrasında) takip edilecektir. Versiyon v{form.version} olarak işaretlenmiştir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
