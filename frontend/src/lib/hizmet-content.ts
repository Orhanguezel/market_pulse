/**
 * Hizmet (services) içerik yükleyici.
 * İçerik kaynağı: src/config/hizmetler/<slug>.json + _index.json manifest.
 *
 * TR şu an tek dolu locale. EN/DE blokları {needs_translation:true} olduğunda
 * TR'ye geri düşülür (graceful fallback) — sayfa asla bu yüzden patlamaz.
 *
 * appName enjeksiyonu: tüm görünür metin alanlarında {{appName}} -> appName.
 * NOT: seo.title ve seo.description verbatim kalır (enjeksiyon uygulanmaz);
 * yalnızca seo.ogTitle / seo.ogDescription enjekte edilir.
 */
import { injectAppName } from '@/lib/page-copy';
import hizmetIndex from '@/config/hizmetler/_index.json';

// ----------------------------------------------------------------------
// Tipler
// ----------------------------------------------------------------------

export type HizmetIndexItem = {
  slug: string;
  category: string;
  module: string | null;
  order: number;
  icon: string;
  title: string;
  eyebrow: string;
  summary: string;
};

export type HizmetCTA = {
  label: string;
  href: string;
};

export type HizmetSectionRichText = {
  type: 'richText';
  heading: string;
  body: string[];
};

export type HizmetSectionCards = {
  type: 'cards';
  heading: string;
  intro?: string;
  items: { title: string; body: string }[];
};

export type HizmetSectionSteps = {
  type: 'steps';
  id?: string;
  heading: string;
  intro?: string;
  steps: { n: number; title: string; body: string }[];
};

export type HizmetSectionBullets = {
  type: 'bullets';
  heading: string;
  intro?: string;
  items: string[];
};

export type HizmetSectionFaq = {
  type: 'faq';
  heading: string;
  items: { q: string; a: string }[];
};

export type HizmetSection =
  | HizmetSectionRichText
  | HizmetSectionCards
  | HizmetSectionSteps
  | HizmetSectionBullets
  | HizmetSectionFaq;

export type HizmetHero = {
  eyebrow: string;
  title: string;
  lead: string;
  primaryCTA: HizmetCTA;
  secondaryCTA: HizmetCTA;
};

export type HizmetSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

export type HizmetClosingCTA = {
  heading: string;
  body: string;
  button: HizmetCTA;
};

export type HizmetContent = {
  slug: string;
  category: string;
  module: string;
  icon: string;
  image?: string;
  seo: HizmetSeo;
  hero: HizmetHero;
  sections: HizmetSection[];
  closingCTA: HizmetClosingCTA;
};

// ----------------------------------------------------------------------
// Manifest
// ----------------------------------------------------------------------

export function getHizmetIndex(): HizmetIndexItem[] {
  const raw = (hizmetIndex as { items?: HizmetIndexItem[] }).items;
  return Array.isArray(raw) ? raw : [];
}

// ----------------------------------------------------------------------
// İçerik yükleme + locale fallback + appName enjeksiyonu
// ----------------------------------------------------------------------

type LocaleBlock = Record<string, unknown> & { needs_translation?: boolean };

function pickLocaleShort(locale: string): 'tr' | 'en' | 'de' {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

/** Bir locale bloğu eksik veya {needs_translation:true} ise kullanışsız sayılır. */
function isUsableLocaleBlock(block: unknown): block is LocaleBlock {
  if (!block || typeof block !== 'object') return false;
  const b = block as LocaleBlock;
  if (b.needs_translation === true) return false;
  // TR şeması zorunlu hero alanı içerir; yoksa kullanma.
  return 'hero' in b && 'sections' in b;
}

/** String alanlara appName enjekte ederken derin geçen yardımcı. */
function inject(value: string, appName: string): string {
  return injectAppName(value, appName);
}

export async function getHizmetContent(
  slug: string,
  locale: string,
  appName: string,
): Promise<HizmetContent | null> {
  let mod: { default?: unknown } | undefined;
  try {
    mod = await import(`@/config/hizmetler/${slug}.json`);
  } catch {
    return null;
  }

  const root = (mod?.default ?? mod) as Record<string, unknown> | undefined;
  if (!root || typeof root !== 'object') return null;

  const locales = (root.locales ?? {}) as Record<string, unknown>;
  const requested = pickLocaleShort(locale);

  // Locale çözümle: istenen blok kullanışsızsa TR'ye düş.
  const candidate = locales[requested];
  const block: LocaleBlock | null = isUsableLocaleBlock(candidate)
    ? candidate
    : isUsableLocaleBlock(locales.tr)
      ? (locales.tr as LocaleBlock)
      : null;

  if (!block) return null;

  const seoRaw = (block.seo ?? {}) as Partial<HizmetSeo>;
  const heroRaw = (block.hero ?? {}) as Partial<HizmetHero>;
  const sectionsRaw = (block.sections ?? []) as HizmetSection[];
  const closingRaw = (block.closingCTA ?? {}) as Partial<HizmetClosingCTA>;

  const injectCTA = (cta?: HizmetCTA): HizmetCTA => ({
    label: inject(cta?.label ?? '', appName),
    href: cta?.href ?? '#',
  });

  // seo.title / seo.description verbatim; yalnız og* enjekte edilir.
  const seo: HizmetSeo = {
    title: seoRaw.title ?? '',
    description: seoRaw.description ?? '',
    ogTitle: inject(seoRaw.ogTitle ?? '', appName),
    ogDescription: inject(seoRaw.ogDescription ?? '', appName),
  };

  const hero: HizmetHero = {
    eyebrow: inject(heroRaw.eyebrow ?? '', appName),
    title: inject(heroRaw.title ?? '', appName),
    lead: inject(heroRaw.lead ?? '', appName),
    primaryCTA: injectCTA(heroRaw.primaryCTA),
    secondaryCTA: injectCTA(heroRaw.secondaryCTA),
  };

  const sections: HizmetSection[] = sectionsRaw.map((s): HizmetSection => {
    switch (s.type) {
      case 'richText':
        return {
          type: 'richText',
          heading: inject(s.heading ?? '', appName),
          body: (s.body ?? []).map((p) => inject(p, appName)),
        };
      case 'cards':
        return {
          type: 'cards',
          heading: inject(s.heading ?? '', appName),
          ...(s.intro ? { intro: inject(s.intro, appName) } : {}),
          items: (s.items ?? []).map((it) => ({
            title: inject(it.title ?? '', appName),
            body: inject(it.body ?? '', appName),
          })),
        };
      case 'steps':
        return {
          type: 'steps',
          ...(s.id ? { id: s.id } : {}),
          heading: inject(s.heading ?? '', appName),
          ...(s.intro ? { intro: inject(s.intro, appName) } : {}),
          steps: (s.steps ?? []).map((st) => ({
            n: st.n,
            title: inject(st.title ?? '', appName),
            body: inject(st.body ?? '', appName),
          })),
        };
      case 'bullets':
        return {
          type: 'bullets',
          heading: inject(s.heading ?? '', appName),
          ...(s.intro ? { intro: inject(s.intro, appName) } : {}),
          items: (s.items ?? []).map((it) => inject(it, appName)),
        };
      case 'faq':
        return {
          type: 'faq',
          heading: inject(s.heading ?? '', appName),
          items: (s.items ?? []).map((it) => ({
            q: inject(it.q ?? '', appName),
            a: inject(it.a ?? '', appName),
          })),
        };
      default:
        return s;
    }
  });

  const closingCTA: HizmetClosingCTA = {
    heading: inject(closingRaw.heading ?? '', appName),
    body: inject(closingRaw.body ?? '', appName),
    button: injectCTA(closingRaw.button),
  };

  return {
    slug: String(root.slug ?? slug),
    category: String(root.category ?? ''),
    module: String(root.module ?? ''),
    icon: String(root.icon ?? 'FileText'),
    image: typeof root.image === 'string' ? root.image : undefined,
    seo,
    hero,
    sections,
    closingCTA,
  };
}
