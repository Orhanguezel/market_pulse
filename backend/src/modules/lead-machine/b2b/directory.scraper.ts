import { request as httpsRequest } from 'node:https';
import { resolve4 } from 'node:dns/promises';
import type { IcpProfile } from '../icp/icp.repository';
import { scrape, searchGoogleMaps, type DirectoryListingData, type Place } from '../_shared/scraper.client';
import { getGoogleMapsKey } from '../../siteSettings';

/**
 * Places isteğini IPv4 üzerinden yapar.
 *
 * NEDEN: Google Maps anahtarı IP kısıtlı (VPS'in IPv4'ü izinli). Ama VPS Google'a
 * IPv6 ile çıkıyordu → "API_KEY_IP_ADDRESS_BLOCKED" (403) ve B2B Google Maps taramaları
 * sonuç döndürmüyordu. family: 4 ile çıkış IP'si izinli IPv4 oluyor.
 */
async function postJsonIpv4(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ status: number; text: string }> {
  const target = new URL(url);
  const payload = JSON.stringify(body);

  // `family: 4` runtime tarafından yok sayılabiliyor (Bun'da tutmadı). Bu yüzden A kaydını
  // KENDİMİZ çözüp doğrudan IPv4 adresine bağlanıyoruz; TLS için servername, HTTP için Host
  // başlığı asıl alan adını taşır.
  const [ipv4] = await resolve4(target.hostname);
  if (!ipv4) throw new Error('PLACES_API_DNS_A_KAYDI_YOK');

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: ipv4,
        servername: target.hostname, // TLS SNI
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          ...headers,
          host: target.hostname,
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 20_000,
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, text }));
      },
    );
    req.on('timeout', () => req.destroy(new Error('PLACES_API_TIMEOUT')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Resmi Google Places API (New) — Text Search. Server-to-server; API anahtarı
 * VPS IP'lerine kısıtlı. scraper-service GMaps yolunun aksine datacenter IP'den çalışır.
 */
async function searchPlacesApi(
  query: string,
  opts: { country?: string; limit?: number },
): Promise<Partial<Place>[]> {
  const apiKey = await getGoogleMapsKey();
  if (!apiKey) return [];

  const regionCode =
    opts.country && /^[A-Za-z]{2}$/.test(opts.country) ? opts.country.toUpperCase() : undefined;

  const res = await postJsonIpv4(
    'https://places.googleapis.com/v1/places:searchText',
    {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.formattedAddress,places.googleMapsUri',
    },
    {
      textQuery: query,
      languageCode: 'en',
      maxResultCount: Math.min(Math.max(opts.limit ?? 10, 1), 20),
      ...(regionCode ? { regionCode } : {}),
    },
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`PLACES_API_${res.status}`);
  }

  const data = JSON.parse(res.text) as {
    places?: Array<{
      displayName?: { text?: string };
      websiteUri?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      formattedAddress?: string;
      googleMapsUri?: string;
    }>;
  };

  return (data.places ?? [])
    .map((p) => ({
      name: p.displayName?.text ?? null,
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
      email: null,
      description: null,
      address: p.formattedAddress ?? null,
      place_url: p.googleMapsUri ?? null,
    }))
    .filter((p) => p.name);
}

export async function searchDirectory(
  source: string,
  icp: IcpProfile | null,
  params: { search_query?: string; country?: string; limit?: number },
): Promise<Partial<Place>[]> {
  const definition = (icp?.definition ?? {}) as { sectors?: string[] };
  const query = params.search_query || definition.sectors?.[0] || 'automotive accessories distributor';

  if (source === 'google_maps') {
    // Önce resmi Google Places API (VPS IP-kısıtlı anahtar, datacenter'dan çalışır).
    const placesKey = await getGoogleMapsKey();
    if (placesKey) {
      return searchPlacesApi(query, { country: params.country, limit: params.limit });
    }
    // Anahtar yoksa eski scraper-service yoluna düş (datacenter IP'den engellenebilir).
    const region = params.country ? params.country.toLowerCase().slice(0, 2) : undefined;
    const data = await searchGoogleMaps(query, {
      total:    Math.min(params.limit ?? 10, 10),
      language: 'en',
      region,
    });
    return data.places ?? [];
  }

  // Europages migrated from .com/search/companies?query= to a .co.uk
  // path-based URL with the keyword embedded directly. The old URL now
  // redirects to /languages and returns no companies.
  const url = source === 'tobb'
    ? `https://www.tobb.org.tr/Sayfalar/Arama.php?q=${encodeURIComponent(query)}`
    : `https://www.europages.co.uk/companies/${encodeURIComponent(query)}.html`;

  const result = await scrape(url, {
    profile:     'directory-listing',
    return_text: true,
    mode:        'stealthy',
    options:     { country: params.country ?? null, limit: params.limit ?? 25 },
  });

  const data = result.data as unknown as DirectoryListingData;
  return (data.companies ?? []).map(c => ({
    name:    c.name,
    website: c.website,
    phone:   c.phone,
    email:   c.email,
    description: c.description,
    address: null,
    place_url: c.source_url,
  }));
}
