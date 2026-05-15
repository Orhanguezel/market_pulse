'use client';

import React from 'react';
import { Quote, Star } from 'lucide-react';
import { useListReviewsPublicQuery } from '@/integrations/rtk/public/reviews.public.endpoints';
import { getPublicAppName } from '@/lib/site-config';

export default function HomeTestimonialsSection() {
  const app = getPublicAppName();
  const { data: reviews = [], isLoading } = useListReviewsPublicQuery({
    limit: 6,
    approved: true,
    orderBy: 'created_at',
    order: 'desc',
  });

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="py-24 bg-[var(--gm-bg)] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="font-display text-[10px] tracking-[0.5em] text-[var(--gm-gold-deep)] uppercase mb-4 block">
            Deneyimler
          </span>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--gm-text)] mb-6">
            Kullanıcı <span className="text-[var(--gm-gold)]">Deneyimleri</span>
          </h2>
          <p className="font-serif italic text-[var(--gm-text-dim)] max-w-2xl mx-auto">
            {app} ile kategori kararlarını kolaylaştıran kullanıcılardan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/20 animate-pulse" />
            ))
          ) : (
            reviews.map((review, idx) => (
              (() => {
                const reviewerName = review.name || 'Anonim Kullanıcı';
                const targetName = review.target_type || 'MarketPulse';

                return (
              <div
                key={review.id}
                className="reveal p-8 rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/10 backdrop-blur-sm relative"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <Quote className="absolute top-6 right-6 text-[var(--gm-gold)]/10" size={48} />
                
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < (review.rating || 0) ? 'text-[var(--gm-gold)] fill-[var(--gm-gold)]' : 'text-[var(--gm-muted)]'} 
                    />
                  ))}
                </div>

                <p className="text-[var(--gm-text)] text-sm italic leading-relaxed mb-6 line-clamp-4">
                  &ldquo;{review.comment}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--gm-gold)]/10 flex items-center justify-center text-[var(--gm-gold)] font-bold text-xs">
                    {reviewerName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--gm-text)]">{reviewerName}</p>
                    <p className="text-[10px] text-[var(--gm-muted)] uppercase tracking-widest">{targetName}</p>
                  </div>
                </div>
              </div>
                );
              })()
            ))
          )}
        </div>
      </div>
    </section>
  );
}
