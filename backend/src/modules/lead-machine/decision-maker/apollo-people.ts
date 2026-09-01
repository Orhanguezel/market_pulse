import { env } from '@/core/env';

export type DecisionMaker = {
  name: string;
  title: string | null;
  linkedin_url: string | null;
  org_name: string | null;
};

/**
 * Apollo people-search (org domain + unvan) ile karar verici adayları.
 * LinkedIn scrape DEĞİL — Apollo lisanslı veri. people/match'in aksine domain başına çoklu kişi.
 */
export async function searchDecisionMakers(
  domain: string,
  titles: string[],
  limit = 5,
): Promise<DecisionMaker[]> {
  if (!env.APOLLO_API_KEY || !domain) return [];
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.APOLLO_API_KEY },
      body: JSON.stringify({
        q_organization_domains_list: [domain],
        person_titles: titles,
        include_similar_titles: false,
        page: 1,
        per_page: Math.min(Math.max(limit, 1), 10),
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      people?: Array<{
        name?: string; first_name?: string; last_name?: string;
        title?: string | null; linkedin_url?: string | null;
        organization?: { name?: string | null } | null;
      }>;
    };
    return (data.people ?? [])
      .map((p) => ({
        name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '',
        title: p.title ?? null,
        linkedin_url: p.linkedin_url ?? null,
        org_name: p.organization?.name ?? null,
      }))
      .filter((p) => p.name);
  } catch {
    return [];
  }
}

/** website → kök domain (protokol/path temizliği) */
export function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith('http') ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}
