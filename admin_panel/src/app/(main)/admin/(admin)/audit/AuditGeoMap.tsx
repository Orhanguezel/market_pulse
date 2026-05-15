'use client';

import React, { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

import type { AuditGeoStatsRowDto } from '@/integrations/shared';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const NUM_TO_A2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '020': 'AD', '024': 'AO',
  '028': 'AG', '032': 'AR', '036': 'AU', '040': 'AT', '044': 'BS',
  '048': 'BH', '050': 'BD', '051': 'AM', '052': 'BB', '056': 'BE',
  '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW', '076': 'BR',
  '084': 'BZ', '090': 'SB', '096': 'BN', '100': 'BG', '104': 'MM',
  '108': 'BI', '112': 'BY', '116': 'KH', '120': 'CM', '124': 'CA',
  '132': 'CV', '140': 'CF', '144': 'LK', '148': 'TD', '152': 'CL',
  '156': 'CN', '158': 'TW', '170': 'CO', '174': 'KM', '178': 'CG',
  '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY',
  '203': 'CZ', '204': 'BJ', '208': 'DK', '212': 'DM', '214': 'DO',
  '218': 'EC', '222': 'SV', '226': 'GQ', '231': 'ET', '232': 'ER',
  '233': 'EE', '242': 'FJ', '246': 'FI', '250': 'FR', '262': 'DJ',
  '266': 'GA', '268': 'GE', '270': 'GM', '276': 'DE', '288': 'GH',
  '296': 'KI', '300': 'GR', '308': 'GD', '320': 'GT', '324': 'GN',
  '328': 'GY', '332': 'HT', '340': 'HN', '348': 'HU', '352': 'IS',
  '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ', '372': 'IE',
  '376': 'IL', '380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP',
  '398': 'KZ', '400': 'JO', '404': 'KE', '408': 'KP', '410': 'KR',
  '414': 'KW', '417': 'KG', '418': 'LA', '422': 'LB', '426': 'LS',
  '428': 'LV', '430': 'LR', '434': 'LY', '438': 'LI', '440': 'LT',
  '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY', '462': 'MV',
  '466': 'ML', '470': 'MT', '478': 'MR', '480': 'MU', '484': 'MX',
  '492': 'MC', '496': 'MN', '498': 'MD', '499': 'ME', '504': 'MA',
  '508': 'MZ', '512': 'OM', '516': 'NA', '520': 'NR', '524': 'NP',
  '528': 'NL', '540': 'NC', '548': 'VU', '554': 'NZ', '558': 'NI',
  '562': 'NE', '566': 'NG', '578': 'NO', '583': 'FM', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH',
  '616': 'PL', '620': 'PT', '624': 'GW', '626': 'TL', '630': 'PR',
  '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW', '659': 'KN',
  '662': 'LC', '670': 'VC', '674': 'SM', '678': 'ST', '682': 'SA',
  '686': 'SN', '688': 'RS', '690': 'SC', '694': 'SL', '702': 'SG',
  '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO', '710': 'ZA',
  '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD', '740': 'SR',
  '748': 'SZ', '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ',
  '764': 'TH', '768': 'TG', '776': 'TO', '780': 'TT', '784': 'AE',
  '788': 'TN', '792': 'TR', '795': 'TM', '798': 'TV', '800': 'UG',
  '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB', '834': 'TZ',
  '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE',
  '882': 'WS', '887': 'YE', '894': 'ZM',
  '-99': 'XK', // Kosovo
};

const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Türkiye', DE: 'Almanya', US: 'ABD', GB: 'Birleşik Krallık',
  FR: 'Fransa', NL: 'Hollanda', IT: 'İtalya', ES: 'İspanya',
  AT: 'Avusturya', CH: 'İsviçre', BE: 'Belçika', PL: 'Polonya',
  SE: 'İsveç', NO: 'Norveç', DK: 'Danimarka', FI: 'Finlandiya',
  RU: 'Rusya', UA: 'Ukrayna', CN: 'Çin', JP: 'Japonya',
  KR: 'Güney Kore', IN: 'Hindistan', BR: 'Brezilya', CA: 'Kanada',
  AU: 'Avustralya', MX: 'Meksika', SA: 'Suudi Arabistan', AE: 'BAE',
  EG: 'Mısır', ZA: 'Güney Afrika', IR: 'İran', IQ: 'Irak',
  SY: 'Suriye', GR: 'Yunanistan', PT: 'Portekiz', IE: 'İrlanda',
  CZ: 'Çekya', RO: 'Romanya', HU: 'Macaristan', BG: 'Bulgaristan',
  RS: 'Sırbistan', HR: 'Hırvatistan', SK: 'Slovakya', SI: 'Slovenya',
  BA: 'Bosna', AL: 'Arnavutluk', MK: 'K. Makedonya', XK: 'Kosova',
  ME: 'Karadağ', GE: 'Gürcistan', AZ: 'Azerbaycan', AM: 'Ermenistan',
  KZ: 'Kazakistan', UZ: 'Özbekistan', TM: 'Türkmenistan',
  KG: 'Kırgızistan', TJ: 'Tacikistan', PK: 'Pakistan', BD: 'Bangladeş',
  ID: 'Endonezya', MY: 'Malezya', TH: 'Tayland', VN: 'Vietnam',
  PH: 'Filipinler', SG: 'Singapur', NZ: 'Yeni Zelanda',
  AR: 'Arjantin', CL: 'Şili', CO: 'Kolombiya', PE: 'Peru',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

function getColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'var(--gm-surface)';
  const ratio = Math.min(count / max, 1);
  // Using GM brand colors for the map scale
  const colors = [
    'rgba(123, 94, 167, 0.2)', // GM primary light
    'rgba(123, 94, 167, 0.4)',
    'rgba(123, 94, 167, 0.6)',
    'rgba(123, 94, 167, 0.8)',
    'var(--gm-primary)'         // Full GM primary
  ];
  return colors[Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 1)];
}

type Props = {
  items: AuditGeoStatsRowDto[];
  loading?: boolean;
};

export const AuditGeoMap: React.FC<Props> = ({ items, loading }) => {
  const t = useAdminT('audit');
  const [tooltip, setTooltip] = useState<{
    name: string;
    code: string;
    count: number;
    unique_ips: number;
    x: number;
    y: number;
  } | null>(null);

  const countByCode = useMemo(() => {
    const map = new Map<string, { count: number; unique_ips: number }>();
    for (const r of items) {
      const c = r.country?.toUpperCase();
      if (!c) continue;
      const prev = map.get(c) ?? { count: 0, unique_ips: 0 };
      map.set(c, {
        count: prev.count + r.count,
        unique_ips: prev.unique_ips + r.unique_ips,
      });
    }
    return map;
  }, [items]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const v of countByCode.values()) m = Math.max(m, v.count);
    return Math.max(1, m);
  }, [countByCode]);

  const totalRequests = useMemo(
    () => items.reduce((s, r) => s + r.count, 0),
    [items],
  );

  const topCountries = useMemo(() => {
    return [...countByCode.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [countByCode]);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div
        className="relative flex-1 rounded-[24px] border border-gm-border-soft bg-gm-bg-deep/50 overflow-hidden shadow-inner group/map"
        onMouseLeave={() => setTooltip(null)}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gm-bg-deep/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-gm-gold animate-spin" />
              <span className="text-sm font-serif italic text-gm-gold/80">{t('map.loading', null, 'Harita yükleniyor...')}</span>
            </div>
          </div>
        )}

        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          width={800}
          height={400}
          className="w-full h-full"
        >
          <ZoomableGroup center={[10, 20]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numId = geo.id ?? geo.properties?.['ISO_N3'] ?? '';
                  const a2 = geo.properties?.['ISO_A2'] ?? NUM_TO_A2[String(numId)] ?? '';
                  const data = countByCode.get(a2);
                  const count = data?.count ?? 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(count, maxCount)}
                      stroke="var(--gm-border-soft)"
                      strokeWidth={0.5}
                      onMouseEnter={(evt) => {
                        const name = getCountryName(a2);
                        setTooltip({
                          name,
                          code: a2,
                          count,
                          unique_ips: data?.unique_ips ?? 0,
                          x: evt.clientX,
                          y: evt.clientY,
                        });
                      }}
                      onMouseMove={(evt) => {
                        setTooltip((prev) => prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: { outline: 'none', transition: 'all 250ms ease' },
                        hover: { fill: count > 0 ? 'var(--gm-gold)' : 'var(--gm-surface-high)', outline: 'none', cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-2xl bg-gm-bg-deep/95 border border-gm-gold/30 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200"
            style={{ left: tooltip.x + 20, top: tooltip.y - 60 }}
          >
            <div className="font-serif italic text-gm-gold text-base">
              {tooltip.name} <span className="font-mono text-xs opacity-60 not-italic">({tooltip.code})</span>
            </div>
            {tooltip.count > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="text-[11px] font-bold text-gm-text uppercase tracking-wider">
                  {tooltip.count} {t('map.requests', null, 'istek')}
                </div>
                <div className="text-[10px] text-gm-muted uppercase tracking-widest font-mono">
                  {tooltip.unique_ips} {t('map.uniqueIps', null, 'benzersiz IP')}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-[10px] text-gm-muted uppercase tracking-widest italic">{t('map.noData', null, 'Veri yok')}</div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Color Legend */}
        <div className="rounded-[24px] border border-gm-border-soft bg-gm-surface/20 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase mb-4">{t('map.legendTitle', null, 'Yoğunluk Skalası')}</h4>
            <div className="flex items-center gap-1.5 h-3">
              {['rgba(123, 94, 167, 0.2)', 'rgba(123, 94, 167, 0.4)', 'rgba(123, 94, 167, 0.6)', 'rgba(123, 94, 167, 0.8)', 'var(--gm-primary)'].map((c, i) => (
                <div key={i} className="flex-1 h-full rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-mono text-gm-muted/60 uppercase">
              <span>Low</span>
              <span>High ({maxCount})</span>
            </div>
          </div>
        </div>

        {/* Top Countries List */}
        <div className="md:col-span-2 rounded-[24px] border border-gm-border-soft bg-gm-surface/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('map.topCountries', null, 'En Aktif Konumlar')}</h4>
            <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 rounded-full text-[10px] font-mono px-3">
              {totalRequests} {t('map.total', null, 'Toplam İstek')}
            </Badge>
          </div>

          {topCountries.length === 0 ? (
            <div className="h-32 flex items-center justify-center font-serif italic text-gm-muted/60 text-sm">
              {t('map.noGeoData', null, 'Konum verisi bulunamadı.')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {topCountries.map((c, i) => {
                const pct = totalRequests > 0 ? ((c.count / totalRequests) * 100).toFixed(1) : '0';
                return (
                  <div key={c.code} className="flex items-center gap-3 group/item">
                    <span className="w-4 font-serif italic text-gm-gold/60 text-xs">{i + 1}.</span>
                    <span className="w-7 font-mono text-[10px] text-gm-muted bg-gm-surface/40 px-1 rounded">{c.code}</span>
                    <span className="flex-1 truncate text-xs font-medium text-gm-text">{getCountryName(c.code)}</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-bold text-gm-text tabular-nums">{c.count}</span>
                      <div className="w-16 h-1 rounded-full bg-gm-surface/40 overflow-hidden">
                        <div 
                          className="h-full bg-gm-gold rounded-full transition-all duration-1000" 
                          style={{ width: `${(c.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
