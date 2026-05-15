import { getOxylabsSettings } from '@/modules/siteSettings/service';

export interface AmazonProduct {
  product_title: string;
  price?: number;
  rating?: number;
  review_count?: number;
  product_url?: string;
  seller_name?: string;
  seller_url?: string;
}

export interface AmazonFilters {
  review_min?: number;
  review_max?: number;
  rating_min?: number;
  rating_max?: number;
  price_min?: number;
  price_max?: number;
}

function numberFrom(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeProduct(item: Record<string, unknown>): AmazonProduct {
  return {
    product_title: String(item.title ?? item.product_title ?? item.name ?? ''),
    price: numberFrom(item.price ?? item.price_str),
    rating: numberFrom(item.rating),
    review_count: numberFrom(item.reviews_count ?? item.review_count),
    product_url: typeof item.url === 'string' ? item.url : typeof item.product_url === 'string' ? item.product_url : undefined,
    seller_name: typeof item.seller_name === 'string' ? item.seller_name : typeof item.seller === 'string' ? item.seller : undefined,
    seller_url: typeof item.seller_url === 'string' ? item.seller_url : undefined,
  };
}

function matchesFilters(product: AmazonProduct, filters: AmazonFilters) {
  const reviews = product.review_count ?? 0;
  const rating = product.rating ?? 0;
  const price = product.price ?? 0;
  if (reviews < (filters.review_min ?? 50)) return false;
  if (reviews > (filters.review_max ?? 500)) return false;
  if (rating < (filters.rating_min ?? 4.0)) return false;
  if (rating > (filters.rating_max ?? 4.5)) return false;
  if (filters.price_min !== undefined && price < filters.price_min) return false;
  if (filters.price_max !== undefined && price > filters.price_max) return false;
  return true;
}

export async function scrapeAmazonProducts(keyword: string, marketplace = 'com', filters: AmazonFilters = {}) {
  const { username, password } = await getOxylabsSettings();
  if (!username || !password) throw new Error('OXYLABS_NOT_CONFIGURED');
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch('https://realtime.oxylabs.io/v1/queries', {
    method: 'POST',
    headers: { authorization: `Basic ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'amazon_search', query: keyword, domain: marketplace, pages: 5, parse: true }),
  });
  if (!res.ok) throw new Error(`OXYLABS_AMAZON_SEARCH_FAILED_${res.status}`);
  const data = await res.json() as { results?: Array<{ content?: { results?: { organic?: Record<string, unknown>[] } } }> };
  const items = data.results?.flatMap(r => r.content?.results?.organic ?? []) ?? [];
  return items.map(normalizeProduct).filter(p => p.product_title && matchesFilters(p, filters));
}

export async function scrapeAmazonReviews(productUrl: string, marketplace = 'com') {
  const { username, password } = await getOxylabsSettings();
  if (!username || !password) throw new Error('OXYLABS_NOT_CONFIGURED');
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch('https://realtime.oxylabs.io/v1/queries', {
    method: 'POST',
    headers: { authorization: `Basic ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'amazon_reviews', url: productUrl, domain: marketplace, pages: 1, parse: true }),
  });
  if (!res.ok) throw new Error(`OXYLABS_AMAZON_REVIEWS_FAILED_${res.status}`);
  const data = await res.json() as { results?: Array<{ content?: { reviews?: Array<{ content?: string; title?: string }> } }> };
  return (data.results?.flatMap(r => r.content?.reviews ?? []) ?? []).slice(0, 50);
}
