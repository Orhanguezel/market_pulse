import 'dotenv/config';

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function parseEnvInt(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? '', 10);
  return isNaN(n) ? fallback : n;
}

function parseEnvList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3077';

/** development: tarayıcıdan farklı portlar (admin 3096, frontend 3077, vb.) CORS’a otomatik eklenir */
const DEV_CORS_EXTRA = [
  'http://localhost:3096',
  'http://127.0.0.1:3096',
  'http://localhost:3077',
  'http://127.0.0.1:3077',
  'http://localhost:3034',
  'http://localhost:3000',
  'http://127.0.0.1:3034',
  'http://127.0.0.1:3000',
];

const CORS_LIST = parseEnvList(process.env.CORS_ORIGIN);
const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
const CORS_ORIGIN = (() => {
  const base = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];
  if (isProd) return base;
  return [...new Set([...DEV_CORS_EXTRA, ...base])];
})();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_NAME: process.env.APP_NAME ?? 'MarketPulse',
  APP_URL: process.env.APP_URL ?? process.env.PUBLIC_URL ?? 'http://localhost:8086',
  TENANT_KEY: process.env.TENANT_KEY ?? 'avrasya',
  PORT: parseEnvInt(process.env.PORT, 8086),
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  DB: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseEnvInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    name: process.env.DB_NAME ?? 'market_pulse_db',
  },

  EXTERNAL_DB: {
    // @deprecated -> tenant_settings.external_erp (Faz 3)
    PASPAS: {
      host: process.env.EXTERNAL_DB_PASPAS_HOST,
      port: parseEnvInt(process.env.EXTERNAL_DB_PASPAS_PORT, 3306),
      user: process.env.EXTERNAL_DB_PASPAS_USER,
      password: process.env.EXTERNAL_DB_PASPAS_PASSWORD,
      name: process.env.EXTERNAL_DB_PASPAS_NAME,
    },
  },

  JWT_SECRET: requireEnv('JWT_SECRET'),
  COOKIE_SECRET: requireEnv('COOKIE_SECRET'),
  CORS_ORIGIN,

  PUBLIC_URL: process.env.PUBLIC_URL ?? process.env.APP_URL ?? 'http://localhost:8086',
  FRONTEND_URL,

  STORAGE_DRIVER: (process.env.STORAGE_DRIVER || 'local').toLowerCase() as 'local' | 'cloudinary',
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',
  STORAGE_CDN_PUBLIC_BASE: process.env.STORAGE_CDN_PUBLIC_BASE || '',
  STORAGE_PUBLIC_API_BASE: process.env.STORAGE_PUBLIC_API_BASE || '',
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || '',
  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || process.env.PUBLIC_URL || process.env.APP_URL || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '',
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || '',
    unsignedUploadPreset: process.env.CLOUDINARY_UNSIGNED_UPLOAD_PRESET || process.env.CLOUDINARY_UNSIGNED_PRESET || '',
    uploadPreset: process.env.CLOUDINARY_UNSIGNED_PRESET || process.env.CLOUDINARY_UNSIGNED_UPLOAD_PRESET || '',
  },

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  AUTH_ADMIN_EMAILS: process.env.AUTH_ADMIN_EMAILS || process.env.ADMIN_EMAIL || '',
  ALLOW_TEMP_LOGIN: process.env.ALLOW_TEMP_LOGIN || '',
  TEMP_PASSWORD: process.env.TEMP_PASSWORD || '',
  DB_ENCRYPTION_KEY: process.env.DB_ENCRYPTION_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseEnvInt(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@localhost',
  REPORT_EMAIL_TO: process.env.REPORT_EMAIL_TO || '',

  SCRAPER_SERVICE_URL:      process.env.SCRAPER_SERVICE_URL      || 'http://localhost:8200',
  SCRAPER_SERVICE_API_KEY:  process.env.SCRAPER_SERVICE_API_KEY  || '',
  // Callback webhook imza doğrulama için — job başlatırken scraper-service'e gönderilir
  SCRAPER_CALLBACK_SECRET:  process.env.SCRAPER_CALLBACK_SECRET  || '',
  OXYLABS_USERNAME: process.env.OXYLABS_USERNAME || '',
  OXYLABS_PASSWORD: process.env.OXYLABS_PASSWORD || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  KEEPA_API_KEY: process.env.KEEPA_API_KEY || '',
  KEEPA_DAILY_TOKEN_BUDGET: parseEnvInt(process.env.KEEPA_DAILY_TOKEN_BUDGET, 1000),
  APOLLO_API_KEY: process.env.APOLLO_API_KEY || '',
  TENTIMES_API_KEY: process.env.TENTIMES_API_KEY || '',
  WHRAI_API_KEY: process.env.WHRAI_API_KEY || '',
} as const;

export type AppEnv = typeof env;
