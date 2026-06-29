import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { getGoogleMapsKey } from '../modules/siteSettings';

type PlaceApiResult = {
  displayName?: { text?: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  googleMapsUri?: string;
  types?: string[];
};

type LeadRow = {
  sirket_isletme_adi: string;
  sehir_lokasyon: string;
  isletme_turu: string;
  karar_verici_ad_soyad: string;
  unvan: string;
  linkedin_profil_linki: string;
  sirket_web_sitesi_veya_sosyal_medya: string;
  kaynak_dogrulama_linki: string;
  kisa_uygunluk_notu: string;
  telefon: string;
  adres: string;
  veri_kaynagi: string;
  dogrulama_durumu: string;
};

const DEFAULT_OUTPUT = resolve(process.cwd(), '..', 'fitness_b2b_target_list_tr.csv');

const cities = [
  'Istanbul',
  'Ankara',
  'Izmir',
  'Bursa',
  'Antalya',
  'Kocaeli',
  'Konya',
  'Adana',
  'Mersin',
  'Mugla',
  'Eskisehir',
  'Gaziantep',
  'Kayseri',
  'Sakarya',
  'Tekirdag',
  'Trabzon',
  'Samsun',
  'Denizli',
  'Balikesir',
  'Aydin',
];

const segments = [
  { query: 'fitness center', type: 'Fitness merkezi / spor salonu' },
  { query: 'spor salonu', type: 'Fitness merkezi / spor salonu' },
  { query: 'pilates studio', type: 'Pilates / reformer stüdyosu' },
  { query: 'reformer pilates', type: 'Pilates / reformer stüdyosu' },
  { query: 'wellness center', type: 'Wellness / sağlıklı yaşam merkezi' },
  { query: 'personal training studio', type: 'Butik fitness / PT stüdyosu' },
];

function argValue(name: string): string | null {
  const prefix = `${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function cityFromAddress(address: string, fallback: string): string {
  const normalized = address
    .replace(/\bT[uü]rkiye\b/gi, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return normalized.at(-1) || fallback;
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function makeKey(place: PlaceApiResult): string {
  const name = place.displayName?.text?.trim().toLowerCase() ?? '';
  const website = place.websiteUri?.trim().toLowerCase() ?? '';
  const address = place.formattedAddress?.trim().toLowerCase() ?? '';
  return website || `${name}|${address}`;
}

function fitNote(segmentType: string, city: string): string {
  return `${city} lokasyonunda ${segmentType.toLowerCase()} olarak Google Places üzerinde doğrulandı; karar verici/LinkedIn profili için manuel Sales Navigator veya açık web doğrulaması önerilir.`;
}

async function getApiKey(): Promise<string> {
  const direct =
    process.env.FITNESS_EXPORT_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    null;
  const key = direct || (await getGoogleMapsKey());
  if (!key) {
    throw new Error(
      'Google Maps anahtarı bulunamadı. FITNESS_EXPORT_GOOGLE_MAPS_API_KEY veya GOOGLE_MAPS_API_KEY env ile çalıştırın ya da site_settings.google_maps_api_key ayarını doldurun.',
    );
  }
  return key;
}

async function searchPlaces(apiKey: string, textQuery: string): Promise<PlaceApiResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.formattedAddress,places.googleMapsUri,places.types',
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'tr',
      regionCode: 'TR',
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as { places?: PlaceApiResult[] };
  return data.places ?? [];
}

function toCsv(rows: LeadRow[]): string {
  const headers = [
    'Şirket / işletme adı',
    'Şehir / lokasyon',
    'İşletme türü',
    'Karar verici kişinin adı-soyadı',
    'Unvanı',
    'LinkedIn profil linki',
    'Şirket web sitesi veya sosyal medya linki',
    'Kaynak / doğrulama linki',
    'Kısa uygunluk notu',
    'Telefon',
    'Adres',
    'Veri kaynağı',
    'Doğrulama durumu',
  ];

  const lines = rows.map((row) =>
    [
      row.sirket_isletme_adi,
      row.sehir_lokasyon,
      row.isletme_turu,
      row.karar_verici_ad_soyad,
      row.unvan,
      row.linkedin_profil_linki,
      row.sirket_web_sitesi_veya_sosyal_medya,
      row.kaynak_dogrulama_linki,
      row.kisa_uygunluk_notu,
      row.telefon,
      row.adres,
      row.veri_kaynagi,
      row.dogrulama_durumu,
    ].map(csvEscape).join(','),
  );

  return [`\uFEFF${headers.map(csvEscape).join(',')}`, ...lines].join('\n');
}

async function main() {
  const target = Number(argValue('--limit') ?? process.env.FITNESS_EXPORT_LIMIT ?? 200);
  const output = resolve(argValue('--output') ?? process.env.FITNESS_EXPORT_OUTPUT ?? DEFAULT_OUTPUT);
  const apiKey = await getApiKey();
  const rows: LeadRow[] = [];
  const seen = new Set<string>();

  for (const city of cities) {
    for (const segment of segments) {
      if (rows.length >= target) break;

      const query = `${segment.query} ${city} Türkiye`;
      console.log(`Searching: ${query}`);
      const places = await searchPlaces(apiKey, query);

      for (const place of places) {
        if (rows.length >= target) break;
        const name = place.displayName?.text?.trim();
        if (!name) continue;

        const key = makeKey(place);
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const address = place.formattedAddress?.trim() ?? '';
        const leadCity = cityFromAddress(address, city);
        const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? '';
        const source = place.googleMapsUri ?? place.websiteUri ?? '';

        rows.push({
          sirket_isletme_adi: name,
          sehir_lokasyon: leadCity,
          isletme_turu: segment.type,
          karar_verici_ad_soyad: '',
          unvan: '',
          linkedin_profil_linki: '',
          sirket_web_sitesi_veya_sosyal_medya: place.websiteUri ?? '',
          kaynak_dogrulama_linki: source,
          kisa_uygunluk_notu: fitNote(segment.type, leadCity),
          telefon: phone,
          adres: address,
          veri_kaynagi: 'Google Places API',
          dogrulama_durumu: 'İşletme doğrulandı; kişi/LinkedIn manuel enrichment bekliyor',
        });
      }

      await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
    }
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, toCsv(rows), 'utf8');
  console.log(`Wrote ${rows.length} leads: ${output}`);

  if (rows.length < target) {
    console.warn(`Target ${target} not reached. Add more cities/segments or rerun with broader queries.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
