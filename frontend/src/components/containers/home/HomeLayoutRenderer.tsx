'use client';

import React, { Suspense } from 'react';
import HeroNew from './HeroNew';
import BannerSlot from './BannerSlot';
import type { HomeSection } from './fetchHomeLayout.server';
import FeaturesNew from './FeaturesNew';
import TransparencySection from './TransparencySection';
import WelcomeBannerSection from './WelcomeBannerSection';
import HomeIntroSection from './HomeIntroSection';
import HomeTestimonialsSection from './HomeTestimonialsSection';
import WaitlistSection from './WaitlistSection';
import PromisesSection from './PromisesSection';
import CompetitorComparisonSection from './CompetitorComparisonSection';
import HomeCTABanner from './HomeCTABanner';

// Yeni component eklemek için: import + bu map'e key ekle.
const REGISTRY: Record<string, any> = {
  HeroNew,
  BannerSlot,
  PromisesSection,
  FeaturesNew,
  TransparencySection,
  WaitlistSection,
  HomeIntroSection,
  WelcomeBannerSection,
  HomeTestimonialsSection,
  CompetitorComparisonSection,
  HomeCTABanner,
};

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  layout: HomeSection[];
  locale?: string;
  /** FeaturesNew için sunucuda önceden çekilen görsel URL’leri */
  featuresImageUrls?: string[];
}

export default function HomeLayoutRenderer({ layout, locale, featuresImageUrls }: Props) {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');

  useEffect(() => {
    if (sectionParam) {
      // Small delay to ensure dynamic content is painted
      const timer = setTimeout(() => {
        const targetId = sectionParam;
        const element = document.getElementById(targetId);
        
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [sectionParam]);

  return (
    <>
      {layout.map((section) => {
        const Component = REGISTRY[section.component_key];
        if (!Component) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[HomeLayoutRenderer] Unknown component_key: ${section.component_key} (slug: ${section.slug})`);
          }
          return null;
        }

        const isHero = section.component_key === 'HeroNew';

        const node = (
          <div id={section.slug} className="scroll-mt-32">
            <Component
              locale={locale}
              label={section.label}
              config={section.config}
              {...(section.component_key === 'FeaturesNew' && featuresImageUrls?.length
                ? { imageUrls: featuresImageUrls }
                : {})}
            />
          </div>
        );

        if (isHero) {
          // Hero hızlı SSR — Suspense'siz
          return <React.Fragment key={section.id}>{node}</React.Fragment>;
        }

        return (
          <Suspense key={section.id} fallback={null}>
            {node}
          </Suspense>
        );
      })}
    </>
  );
}
