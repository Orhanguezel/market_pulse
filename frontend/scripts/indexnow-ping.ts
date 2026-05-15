const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
if (!siteUrl) {
  console.error('NEXT_PUBLIC_SITE_URL is required.');
  process.exit(1);
}
const key = String(process.env.INDEXNOW_KEY || process.env.NEXT_PUBLIC_INDEXNOW_KEY || '').trim();

if (!key) {
  console.error('INDEXNOW_KEY is required.');
  process.exit(1);
}

const host = new URL(siteUrl).host;
const keyLocation = `${siteUrl}/${key}.txt`;
const urlList = [
  `${siteUrl}/`,
  `${siteUrl}/tr`,
  `${siteUrl}/tr/consultants`,
  `${siteUrl}/tr/blog`,
  `${siteUrl}/tr/explore`,
  `${siteUrl}/tr/tarot`,
  `${siteUrl}/tr/numeroloji`,
  `${siteUrl}/tr/pricing`,
  `${siteUrl}/tr/faqs`,
];

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

const body = await response.text();

if (!response.ok) {
  console.error(`IndexNow ping failed: ${response.status} ${response.statusText}`);
  if (body) console.error(body);
  process.exit(1);
}

console.log(`IndexNow ping accepted for ${urlList.length} URLs.`);
