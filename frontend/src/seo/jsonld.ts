// src/seo/jsonld.ts
export type Thing = Record<string, unknown>;

export function graph(items: Thing[]): Thing {
  // Google, @graph formatını sever; çoklu schema objesini tek scriptte basmak için idealdir.
  return {
    '@context': 'https://schema.org',
    '@graph': Array.isArray(items) ? items : [],
  };
}

export function sameAsFromSocials(socials?: Record<string, unknown> | null): string[] {
  const s = socials && typeof socials === 'object' ? socials : {};
  const urls: string[] = [];

  for (const key of Object.keys(s)) {
    const raw = (s as any)[key];
    const v = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!v) continue;

    // Sadece http(s) olanları al
    if (!/^https?:\/\//i.test(v)) continue;

    urls.push(v);
  }

  // uniq
  return Array.from(new Set(urls));
}

export function org(input: {
  id?: string; // e.g. "https://site.com/#org"
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  description?: string;
  priceRange?: string;
  areaServed?: string | string[];
}): Thing {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.areaServed
      ? {
          areaServed: (Array.isArray(input.areaServed) ? input.areaServed : [input.areaServed]).map((name) => ({
            '@type': 'Country',
            name,
          })),
        }
      : {}),
  };
}

export function website(input: {
  id?: string; // e.g. "https://site.com/#website"
  name: string;
  url: string;
  publisherId?: string; // org @id reference
  searchUrlTemplate?: string;
}): Thing {
  const base: Thing = {
    '@type': 'WebSite',
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    url: input.url,
    ...(input.publisherId ? { publisher: { '@id': input.publisherId } } : {}),
  };

  if (input.searchUrlTemplate) {
    (base as any).potentialAction = {
      '@type': 'SearchAction',
      target: input.searchUrlTemplate,
      'query-input': 'required name=q',
    };
  }

  return base;
}

export function product(input: {
  name: string;
  description?: string;
  image?: string | string[];
  sku?: string;
  brand?: string;
  offers?:
    | {
        price: number;
        priceCurrency: string;
        availability?: string;
        url?: string;
      }
    | Array<{
        price: number;
        priceCurrency: string;
        availability?: string;
        url?: string;
      }>;
}): Thing {
  return { '@context': 'https://schema.org', '@type': 'Product', ...input };
}

export function article(input: {
  headline: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: { name: string };
}): Thing {
  return { '@context': 'https://schema.org', '@type': 'Article', ...input };
}

export function breadcrumb(items: Array<{ name: string; item: string }>): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

export const breadcrumbSchema = breadcrumb;

export function localBusiness(input: {
  id?: string;
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  founder?: { name: string };
  priceRange?: string;
  image?: string;
  logo?: string;
  sameAs?: string[];
  openingHours?: string[];
  serviceType?: string;
  areaServed?: string;
}): Thing {
  return {
    '@type': ['ProfessionalService', 'LocalBusiness'],
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    description: input.description,
    url: input.url,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.address
      ? {
          address: {
            '@type': 'PostalAddress',
            ...input.address,
          },
        }
      : {}),
    ...(input.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.geo.latitude,
            longitude: input.geo.longitude,
          },
        }
      : {}),
    ...(input.founder
      ? { founder: { '@type': 'Person', name: input.founder.name } }
      : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.openingHours?.length ? { openingHoursSpecification: input.openingHours } : {}),
    ...(input.serviceType
      ? {
          makesOffer: {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              serviceType: input.serviceType,
              ...(input.areaServed ? { areaServed: { '@type': 'Country', name: input.areaServed } } : {}),
            },
          },
        }
      : {}),
  };
}

export function faqPage(items: Array<{ question: string; answer: string }>): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

export const faqSchema = faqPage;

// ─────────────────────────────────────────────────────────────────
// T31-A3 + T31-B1..B4: danışman / içerik schema helper'ları (marka site-config ile uyumlu)
// ─────────────────────────────────────────────────────────────────

/**
 * Consultant Person schema — danışman detay sayfası için.
 * Person + makesOffer (services) + aggregateRating birleşimi.
 */
export function consultantPerson(input: {
  id?: string;
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  knowsAbout?: string[]; // expertise
  knowsLanguage?: string[];
  worksForId?: string; // Organization @id reference
  services?: Array<{
    name: string;
    description?: string;
    price?: number;
    priceCurrency?: string;
    durationMinutes?: number;
    isFree?: boolean;
    url?: string;
  }>;
  rating?: { value: number; count: number };
  sameAs?: string[];
}): Thing {
  const node: Thing = {
    '@type': 'Person',
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.knowsAbout?.length ? { knowsAbout: input.knowsAbout } : {}),
    ...(input.knowsLanguage?.length ? { knowsLanguage: input.knowsLanguage } : {}),
    ...(input.worksForId ? { worksFor: { '@id': input.worksForId } } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };

  if (input.services?.length) {
    (node as any).makesOffer = input.services.map((s) => ({
      '@type': 'Offer',
      ...(s.url ? { url: s.url } : {}),
      ...(typeof s.price === 'number'
        ? {
            price: s.isFree ? 0 : s.price,
            priceCurrency: s.priceCurrency || 'TRY',
          }
        : {}),
      itemOffered: {
        '@type': 'Service',
        name: s.name,
        ...(s.description ? { description: s.description } : {}),
        ...(s.durationMinutes
          ? {
              estimatedDuration: `PT${s.durationMinutes}M`,
            }
          : {}),
        ...(s.isFree ? { eligibleQuantity: { '@type': 'QuantitativeValue', value: 1 } } : {}),
      },
    }));
  }

  if (input.rating && input.rating.count > 0) {
    (node as any).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(input.rating.value).toFixed(1),
      reviewCount: input.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return node;
}

export const consultantPersonSchema = consultantPerson;

/**
 * Service / hizmet paketi schema — bağımsız Service node (consultant detayında veya pricing'de).
 */
export function service(input: {
  id?: string;
  name: string;
  description?: string;
  providerId?: string; // organization or person @id
  serviceType?: string;
  areaServed?: string;
  offers?: { price: number; priceCurrency: string; url?: string };
  durationMinutes?: number;
}): Thing {
  return {
    '@type': 'Service',
    ...(input.id ? { '@id': input.id } : {}),
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.providerId ? { provider: { '@id': input.providerId } } : {}),
    ...(input.serviceType ? { serviceType: input.serviceType } : {}),
    ...(input.areaServed ? { areaServed: { '@type': 'Country', name: input.areaServed } } : {}),
    ...(input.durationMinutes ? { estimatedDuration: `PT${input.durationMinutes}M` } : {}),
    ...(input.offers
      ? {
          offers: {
            '@type': 'Offer',
            price: input.offers.price,
            priceCurrency: input.offers.priceCurrency,
            ...(input.offers.url ? { url: input.offers.url } : {}),
          },
        }
      : {}),
  };
}

/**
 * ItemList schema — /consultants liste sayfası için.
 */
export function itemList(input: {
  url: string;
  name?: string;
  items: Array<{
    name: string;
    url: string;
    image?: string;
    position?: number;
    rating?: { value: number; count: number };
  }>;
}): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(input.name ? { name: input.name } : {}),
    url: input.url,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((it, i) => ({
      '@type': 'ListItem',
      position: it.position ?? i + 1,
      url: it.url,
      item: {
        '@type': 'Person',
        name: it.name,
        url: it.url,
        ...(it.image ? { image: it.image } : {}),
        ...(it.rating && it.rating.count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(it.rating.value).toFixed(1),
                reviewCount: it.rating.count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
    })),
  };
}

/**
 * Genişletilmiş Article schema — speakable + author + dateModified.
 */
export function articleEnhanced(input: {
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string; // ISO
  dateModified?: string; // ISO
  author?: { name: string; url?: string; jobTitle?: string };
  publisherId?: string; // organization @id
  url?: string;
  speakableSelectors?: string[]; // CSS selectors — örn ["h1","[data-speakable]"]
  inLanguage?: string;
}): Thing {
  const node: Thing = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.url ? { mainEntityOfPage: input.url } : {}),
    ...(input.inLanguage ? { inLanguage: input.inLanguage } : {}),
  };

  if (input.author) {
    (node as any).author = {
      '@type': 'Person',
      name: input.author.name,
      ...(input.author.url ? { url: input.author.url } : {}),
      ...(input.author.jobTitle ? { jobTitle: input.author.jobTitle } : {}),
    };
  }

  if (input.publisherId) {
    (node as any).publisher = { '@id': input.publisherId };
  }

  if (input.speakableSelectors?.length) {
    (node as any).speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: input.speakableSelectors,
    };
  }

  return node;
}

export const articleSchema = articleEnhanced;

/**
 * Review schema — danışman yorum kartları için.
 */
export function review(input: {
  itemReviewedId?: string; // Person/Service @id reference
  itemReviewedName: string;
  authorName: string;
  reviewBody: string;
  ratingValue: number;
  datePublished?: string;
}): Thing {
  return {
    '@type': 'Review',
    itemReviewed: input.itemReviewedId
      ? { '@id': input.itemReviewedId }
      : { '@type': 'Thing', name: input.itemReviewedName },
    author: { '@type': 'Person', name: input.authorName },
    reviewBody: input.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.ratingValue,
      bestRating: 5,
      worstRating: 1,
    },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
  };
}
