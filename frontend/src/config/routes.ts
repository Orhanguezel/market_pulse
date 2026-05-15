export const ROUTES = {
  home: '/',
  about: '/about',
  blog: {
    index: '/blog',
    detail: (slug: string) => `/blog/${slug}`,
  },
  profile: {
    index: '/profile',
  },
  contact: '/contact',
  faqs: '/faqs',
  legal: {
    terms: '/terms',
    privacy: '/privacy-policy',
    cookie: '/cookie-policy',
    kvkk: '/kvkk',
  },
} as const;
