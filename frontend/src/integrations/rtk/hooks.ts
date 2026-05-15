// =============================================================
// FILE: src/integrations/rtk/hooks.ts
// Barrel exports for RTK Query hooks
// =============================================================

// Auth
export * from './public/auth.endpoints';

// Public content
export * from './public/reviews.public.endpoints';
export * from './public/storage_public.endpoints';
export * from './public/kvkk.endpoints';
export * from './public/custom_pages.endpoints';
export * from './public/sliders.endpoints';
export * from './public/contacts.endpoints';
export * from './public/banners.endpoints';
export * from './public/popups.endpoints';
export * from './public/resources.endpoints';
export * from './public/newsletter_public.endpoints';

// Settings / infra
export * from './public/site_settings.endpoints';
export * from './public/faqs.endpoints';
export * from './public/menu_items.endpoints';
export * from './public/footer_sections.endpoints';
export * from './public/notifications.endpoints';
export * from './public/mail.endpoints';
export * from './public/profiles.endpoints';
export * from './public/user_roles.endpoints';
export * from './public/health.endpoints';
export * from './public/geocode.endpoints';

// Subscriptions / orders
export * from './public/subscriptions.endpoints';
export * from './public/orders.endpoints';

// Amazon scan (public SaaS)
export * from './public/amazon_scan.endpoints';
