'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const REFERRAL_RATES: Record<string, number> = {
  'Araç Aksesuarı': 0.12,
  'Elektronik':     0.08,
  'Ev & Mutfak':    0.15,
  'Giyim':          0.17,
  'Oyuncak':        0.15,
  'Spor & Outdoor': 0.15,
  'Kitap & Medya':  0.15,
  'Güzellik':       0.08,
  'Sağlık':         0.08,
  'Diğer':          0.15,
};

const FBA_FEES: Record<string, number> = {
  'Küçük (< 300g)':        2.92,
  'Standart (300g-1kg)':   4.18,
  'Büyük (1-2kg)':         5.42,
  'Ağır (2-5kg)':          8.54,
};

interface Result {
  grossProfit: number;
  netProfit: number;
  roi: number;
  margin: number;
  breakEven: number;
  totalCost: number;
  referralFee: number;
}

function calculate(
  purchase: number,
  selling: number,
  referralRate: number,
  fbaFee: number,
  shipping: number,
  customs: number,
  other: number,
): Result | null {
  if (purchase <= 0 || selling <= 0) return null;
  const referralFee = selling * referralRate;
  const totalCost   = purchase + fbaFee + shipping + customs + other;
  const netProfit   = selling - referralFee - totalCost;
  const grossProfit = selling - referralFee;
  const roi         = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const margin      = selling > 0 ? (netProfit / selling) * 100 : 0;
  const breakEven   = totalCost / (1 - referralRate);
  return { grossProfit, netProfit, roi, margin, breakEven, totalCost, referralFee };
}

function NumInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">{label}</label>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '0.00'}
        className="h-11 w-full rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-sm text-(--gm-text) placeholder:text-(--gm-muted)/40 focus:border-(--gm-primary) focus:outline-none"
      />
    </div>
  );
}

function SelectInput({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/20 px-4 text-sm text-(--gm-text) focus:border-(--gm-primary) focus:outline-none"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MetricBox({ label, value, positive }: { label: string; value: string; positive?: boolean | null }) {
  return (
    <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/10 p-3 text-center">
      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">{label}</div>
      <div className={cn(
        'mt-1 font-display text-xl font-semibold',
        positive === true ? 'text-emerald-500'
          : positive === false ? 'text-red-500'
          : 'text-(--gm-text)',
      )}>{value}</div>
    </div>
  );
}

interface Props {
  compact?: boolean;
}

export default function PublicProfitCalculator({ compact }: Props) {
  const [purchase, setPurchase] = React.useState('');
  const [selling, setSelling]   = React.useState('');
  const [category, setCategory] = React.useState('Araç Aksesuarı');
  const [fbaSize, setFbaSize]   = React.useState('Standart (300g-1kg)');
  const [shipping, setShipping] = React.useState('');
  const [customs, setCustoms]   = React.useState('');
  const [other, setOther]       = React.useState('');
  const [result, setResult]     = React.useState<Result | null>(null);

  const handleCalc = () => {
    setResult(calculate(
      Number(purchase) || 0,
      Number(selling) || 0,
      REFERRAL_RATES[category] ?? 0.15,
      FBA_FEES[fbaSize] ?? 4.18,
      Number(shipping) || 0,
      Number(customs) || 0,
      Number(other) || 0,
    ));
  };

  const fmt = (n: number, pct = false) =>
    pct ? `${n.toFixed(1)}%` : `€${n.toFixed(2)}`;

  return (
    <div className={cn('rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface)/5 p-5 space-y-4', compact && 'p-4 space-y-3')}>
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-(--gm-primary)" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-muted)">Kar Simülatörü</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Alış Fiyatı (€)" value={purchase} onChange={setPurchase} />
        <NumInput label="Satış Fiyatı (€)" value={selling} onChange={setSelling} />
        <SelectInput
          label={`Kategori (${(REFERRAL_RATES[category] * 100).toFixed(0)}%)`}
          value={category}
          onChange={setCategory}
          options={Object.entries(REFERRAL_RATES).map(([k, v]) => ({
            value: k, label: `${k} (${(v * 100).toFixed(0)}%)`,
          }))}
        />
        <SelectInput
          label={`FBA Boyutu (€${(FBA_FEES[fbaSize] ?? 0).toFixed(2)})`}
          value={fbaSize}
          onChange={setFbaSize}
          options={Object.entries(FBA_FEES).map(([k, v]) => ({
            value: k, label: `${k} (€${v.toFixed(2)})`,
          }))}
        />
        <NumInput label="Kargo (€)" value={shipping} onChange={setShipping} />
        <NumInput label="Gümrük / Vergi (€)" value={customs} onChange={setCustoms} />
        <NumInput label="Diğer (€)" value={other} onChange={setOther} />
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleCalc}
            className="h-11 w-full rounded-2xl bg-(--gm-primary) text-[11px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
          >
            Hesapla
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Net Kar" value={fmt(result.netProfit)} positive={result.netProfit >= 0} />
            <MetricBox label="ROI" value={fmt(result.roi, true)} positive={result.roi >= 0} />
            <MetricBox
              label="Margin"
              value={fmt(result.margin, true)}
              positive={result.margin >= 15 ? true : result.margin >= 0 ? null : false}
            />
            <MetricBox label="Break-Even" value={fmt(result.breakEven)} />
          </div>
          <p className="text-[10px] text-(--gm-muted)/60">
            Referral: €{result.referralFee.toFixed(2)} · Toplam maliyet: €{result.totalCost.toFixed(2)}
          </p>
        </>
      )}
    </div>
  );
}
