'use client';

import * as React from 'react';
import { 
  Activity, 
  Building2, 
  Radar, 
  TrendingUp, 
  Users,
  ChevronRight,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMarketStatsQuery } from '@/integrations/hooks';
import { useAdminSettings } from '@/app/(main)/admin/_components/admin-settings-provider';
import { cn } from '@/lib/utils';

export default function MarketDashboard() {
  const { data: stats, isLoading } = useGetMarketStatsQuery();
  const { branding } = useAdminSettings();

  const stats_cards = [
    { 
      label: 'Hedef Firmalar', 
      value: stats?.totalTargets, 
      icon: Building2, 
      href: '/admin/market/targets', 
      color: 'text-gm-gold',
      badge: 'Takipte'
    },
    { 
      label: 'Lead Pipeline',  
      value: stats?.totalLeads,   
      icon: Target,     
      href: '/admin/market/leads',   
      color: 'text-gm-primary-light',
      badge: 'Potansiyel'
    },
    { 
      label: 'Bekleyen Sinyal', 
      value: stats?.pendingSignals, 
      icon: Zap, 
      href: '/admin/market/signals', 
      color: 'text-gm-warning',
      badge: 'Aksiyon Bekleyen'
    },
  ];

  const module_cards = [
    { 
      label: 'İstihbarat Yönetimi', 
      desc: 'Rakip ve bayi firmaları izleyin, churn risklerini otomatik analiz edin.', 
      href: '/admin/market/targets', 
      icon: Building2,
      tag: 'CORE'
    },
    { 
      label: 'Satış Hunisi',  
      desc: 'Sıcak fırsatları takip edin, kaynak bazlı dönüşüm skorlarını inceleyin.', 
      href: '/admin/market/leads', 
      icon: Users,
      tag: 'PIPELINE'
    },
    { 
      label: 'Sinyal Merkezi',      
      desc: 'Pazardaki dijital ayak izlerini ve fiyat değişikliklerini yakalayın.', 
      href: '/admin/market/signals', 
      icon: Activity,
      tag: 'LIVE'
    },
    { 
      label: 'Lead Machine',      
      desc: 'Amazon ve B2B dizinlerinden yeni lead adayları keşfedin.', 
      href: '/admin/market/lead-machine/candidates', 
      icon: Zap,
      tag: 'GROWTH'
    },
  ];

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-gm-bg-deep border border-gm-border-soft p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <Radar className="w-full h-full text-gm-gold animate-pulse" />
        </div>
        
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gm-gold" />
            <span className="text-gm-text/70 font-bold text-[10px] tracking-[0.2em] uppercase">Pazar Genel Bakış</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-5xl text-gm-text leading-tight">
              {branding.app_name || 'MarketPulse'} <span className="italic text-gm-muted">Dashboard</span>
            </h1>
            <p className="text-gm-muted text-lg font-serif italic leading-relaxed">
              Pazar dinamiklerini, rakip hareketlerini ve satış fırsatlarını tek bir premium merkezden yönetin.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/admin/market/targets">
              <div className="px-8 py-4 bg-gm-gold hover:bg-gm-gold-light text-black rounded-full font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2">
                Analize Başla
                <ArrowUpRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats_cards.map(({ label, value, icon: Icon, href, color, badge }) => (
          <Link key={label} href={href}>
            <Card className="group bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl hover:bg-gm-surface/30 transition-all cursor-pointer">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center border border-gm-border-soft bg-gm-bg-deep group-hover:border-gm-gold/30 transition-all", color)}>
                    <Icon size={24} />
                  </div>
                  <div className="text-[10px] font-bold text-gm-muted tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                    {badge}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gm-muted text-[10px] font-bold tracking-[0.2em] uppercase">{label}</div>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <Skeleton className="h-10 w-20 bg-gm-surface/40" />
                    ) : (
                      <span className="text-4xl font-serif text-gm-text tracking-tighter">{value ?? 0}</span>
                    )}
                    <span className="text-xs text-gm-muted font-mono">Birim</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Modules Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">Modüller</span>
          <div className="h-px flex-1 bg-gm-border-soft" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {module_cards.map(({ label, desc, href, icon: Icon, tag }) => (
            <Link key={label} href={href}>
              <Card className="group h-full bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl hover:border-gm-gold/30 transition-all cursor-pointer">
                <CardContent className="p-10 flex flex-col h-full space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="size-14 rounded-full bg-gm-surface flex items-center justify-center text-gm-gold border border-gm-border-soft group-hover:bg-gm-gold group-hover:text-black transition-all">
                      <Icon size={28} />
                    </div>
                    <div className="px-3 py-1 rounded-full border border-gm-border-soft text-[8px] font-bold text-gm-muted tracking-widest uppercase">
                      {tag}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="font-serif text-2xl text-gm-text group-hover:text-gm-gold transition-colors">{label}</h3>
                    <p className="text-gm-muted text-sm font-serif italic leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-[10px] font-bold text-gm-gold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Modüle Git
                    <ChevronRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
