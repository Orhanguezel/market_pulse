'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';

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
import { cn } from '@/lib/utils';

const REFERRAL_RATES: Record<string, number> = {
  'Araç Aksesuarı':   0.12,
  'Elektronik':       0.08,
  'Ev & Mutfak':      0.15,
  'Giyim':            0.17,
  'Oyuncak':          0.15,
  'Spor & Outdoor':   0.15,
  'Kitap & Medya':    0.15,
  'Güzellik':         0.08,
  'Sağlık':           0.08,
  'Diğer':            0.15,
};

const FBA_FEES: Record<string, number> = {
  'Küçük (< 300g)':   2.92,
  'Standart (300g-1kg)': 4.18,
  'Büyük (1-2kg)':    5.42,
  'Ağır (2-5kg)':     8.54,
};

interface Result {
  grossProfit: number;
  netProfit: number;
  roi: number;
  margin: number;
  breakEven: number;
}

function calculate(
  purchasePrice: number,
  sellingPrice: number,
  referralRate: number,
  fbaFee: number,
  shipping: number,
  customs: number,
  other: number,
): Result | null {
  if (purchasePrice <= 0 || sellingPrice <= 0) return null;

  const referralFee = sellingPrice * referralRate;
  const totalCost = purchasePrice + fbaFee + shipping + customs + other;
  const netProfit = sellingPrice - referralFee - totalCost;
  const grossProfit = sellingPrice - referralFee;
  const roi = (netProfit / totalCost) * 100;
  const margin = (netProfit / sellingPrice) * 100;
  const breakEven = totalCost / (1 - referralRate);

  return { grossProfit, netProfit, roi, margin, breakEven };
}

function MetricCard({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-4 text-center">
      <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-gm-muted mb-1">{label}</div>
      <div className={cn('font-serif text-2xl font-light', cls ?? 'text-gm-text')}>{value}</div>
    </div>
  );
}

export default function ProfitCalculator() {
  const [purchasePrice, setPurchasePrice] = React.useState('');
  const [sellingPrice, setSellingPrice] = React.useState('');
  const [category, setCategory] = React.useState('Araç Aksesuarı');
  const [fbaSize, setFbaSize] = React.useState('Standart (300g-1kg)');
  const [shipping, setShipping] = React.useState('');
  const [customs, setCustoms] = React.useState('');
  const [other, setOther] = React.useState('');
  const [result, setResult] = React.useState<Result | null>(null);

  const handleCalculate = () => {
    const r = calculate(
      Number(purchasePrice) || 0,
      Number(sellingPrice) || 0,
      REFERRAL_RATES[category] ?? 0.15,
      FBA_FEES[fbaSize] ?? 4.18,
      Number(shipping) || 0,
      Number(customs) || 0,
      Number(other) || 0,
    );
    setResult(r);
  };

  const fmt = (n: number, currency = true) =>
    currency ? `€${n.toFixed(2)}` : `${n.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-gm-gold" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Ticari Uygunluk</span>
      </div>
      <h2 className="font-serif text-3xl text-gm-text -mt-2">Kar Simülatörü</h2>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
        <CardContent className="space-y-5 p-6">
          {/* Row 1 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Alış Fiyatı (€)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text"
              />
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Hedef Satış Fiyatı (€)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text"
              />
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                  {Object.keys(REFERRAL_RATES).map((k) => (
                    <SelectItem key={k} value={k}>{k} ({(REFERRAL_RATES[k] * 100).toFixed(0)}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">FBA Ürün Boyutu</Label>
              <Select value={fbaSize} onValueChange={setFbaSize}>
                <SelectTrigger className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                  {Object.entries(FBA_FEES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{k} (€{v.toFixed(2)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kargo (€)</Label>
              <Input type="number" min={0} step={0.01} value={shipping} onChange={(e) => setShipping(e.target.value)}
                placeholder="0.00" className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Gümrük / Vergi (€)</Label>
              <Input type="number" min={0} step={0.01} value={customs} onChange={(e) => setCustoms(e.target.value)}
                placeholder="0.00" className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Diğer Maliyet (€)</Label>
              <Input type="number" min={0} step={0.01} value={other} onChange={(e) => setOther(e.target.value)}
                placeholder="0.00" className="h-11 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text" />
            </div>
            <Button
              onClick={handleCalculate}
              className="h-11 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
            >
              <TrendingUp className="mr-2 size-4" />
              Hesapla
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Net Kar"
            value={fmt(result.netProfit)}
            cls={result.netProfit >= 0 ? 'text-gm-success' : 'text-gm-error'}
          />
          <MetricCard
            label="ROI"
            value={fmt(result.roi, false)}
            cls={result.roi >= 0 ? 'text-gm-success' : 'text-gm-error'}
          />
          <MetricCard
            label="Margin"
            value={fmt(result.margin, false)}
            cls={result.margin >= 15 ? 'text-gm-success' : result.margin >= 0 ? 'text-gm-warning' : 'text-gm-error'}
          />
          <MetricCard
            label="Break-Even Fiyat"
            value={fmt(result.breakEven)}
          />
        </div>
      )}

      {result && (
        <p className="text-[10px] text-gm-muted/60">
          Referral fee: {(REFERRAL_RATES[category] * 100).toFixed(0)}% · FBA: €{FBA_FEES[fbaSize].toFixed(2)} ·
          Toplam maliyet: €{(Number(purchasePrice) + FBA_FEES[fbaSize] + Number(shipping) + Number(customs) + Number(other)).toFixed(2)}
        </p>
      )}
    </div>
  );
}
