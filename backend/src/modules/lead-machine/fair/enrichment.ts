// =============================================================
// FILE: backend/src/modules/lead-machine/fair/enrichment.ts
// Port of scripts/import-automechanika-to-db.py logic so the runtime
// fair-scan produces the same shape (mail_classification +
// recommendation + Turkish summary) the admin panel renders.
// =============================================================

export type MailType =
  | 'personal_fl'
  | 'personal_il'
  | 'personal_dept'
  | 'personal_role'
  | 'personal_single'
  | 'generic'
  | 'other'
  | 'none';

export type RecommendationAction =
  | 'APPROVE_FAVORITE'
  | 'APPROVE_DIRECT'
  | 'APPROVE_WITH_REVIEW'
  | 'RESEARCH'
  | 'LOW_PRIORITY'
  | 'REJECT';

export interface Recommendation {
  action: RecommendationAction;
  badge: string;
  reasoning: string;
}

const DEPT_LOCALS = new Set([
  'purchasing', 'einkauf', 'procurement', 'satinalma', 'achat',
  'category', 'aftermarket', 'accessories', 'distribution',
]);

const GENERIC_LOCALS = new Set([
  'info', 'office', 'contact', 'sales', 'export', 'kontakt', 'biuro', 'service',
  'marketing', 'vertrieb', 'verkauf', 'mail', 'kundenservice', 'admin', 'team', 'hello',
  'support', 'reception', 'enquiry', 'enquiries', 'sekretariat',
  'reach', 'reachable', 'feedback', 'firma',
]);

export function classifyMail(email: string | null | undefined): MailType {
  if (!email) return 'none';
  const local = (email.split('@')[0] || '').toLowerCase();
  if (!local) return 'none';

  if (DEPT_LOCALS.has(local)) return 'personal_dept';
  if (GENERIC_LOCALS.has(local)) return 'generic';
  if (/^(info|sales|office|contact|export|kontakt)[-._]/.test(local)) return 'generic';
  if (/^[a-z]+\.[a-z]+$/.test(local)) return 'personal_fl';
  if (/^[a-z]\.[a-z]+$/.test(local)) return 'personal_il';
  if (/^[a-z]{2,4}\.[a-z]{2,4}$/.test(local)) return 'personal_role';
  if (/^[a-z]+$/.test(local)) return 'personal_single';
  if (/^[a-z]+[._][a-z]+$/.test(local)) return 'personal_fl';
  return 'other';
}

const POSITIVE_KEYWORDS = [
  'distrib', 'wholesale', 'großhandel', 'grosshandel', 'handel', 'handels',
  'import', 'export', 'trading',
  'aftermarket', 'accessor', 'aksesuar',
  'mat ', 'fußmat', 'tapis',
  'interior', 'innenraum',
  'tuning', 'styling',
];

export function positiveHit(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return POSITIVE_KEYWORDS.some((k) => n.includes(k));
}

const SUSPICIOUS_CATEGORY_TOKENS = [
  'cooling', 'battery', 'lighting', 'lubricant', 'tire', 'reifen', 'oil',
  'brake', 'gasket', 'powertrain', 'starter', 'alternator', 'filter',
  'audio', 'diagnos', 'welding', 'paint', 'trailer', 'clutch', 'steering',
  'turbo', 'windshield', 'glas', 'suspension', 'fragrance', 'perfume',
];

const MAIL_TYPE_BASE_SCORE: Record<MailType, number> = {
  personal_fl: 7.5,
  personal_il: 7.2,
  personal_dept: 7.0,
  personal_role: 6.8,
  personal_single: 6.5,
  generic: 5.5,
  other: 6.0,
  none: 4.0,
};

export function computeScore(
  name: string | null | undefined,
  countryIso: string | null | undefined,
  mailType: MailType,
  keywordOverlapBoost = 0,
): number {
  let score = MAIL_TYPE_BASE_SCORE[mailType];
  if (positiveHit(name)) score += 1.0;
  if (countryIso === 'DE' || countryIso === 'DEU' || countryIso === 'PL' || countryIso === 'POL') score += 0.3;
  score += keywordOverlapBoost;
  return Math.min(10.0, Math.round(score * 10) / 10);
}

export interface KeywordOverlapResult {
  shared: string[];
  count: number;
  boost: number;
}

// Words too generic to count as a meaningful overlap signal on their own.
const STOP_TOKENS = new Set([
  'and', 'the', 'for', 'with', 'from', 'auto', 'car', 'cars',
  'und', 'der', 'die', 'das', 'fur', 'mit', 'auf',
  've', 'ile', 'icin', 'oto',
]);

function tokenize(s: string): string[] {
  // Strip HTML entities (Messe sometimes leaves &amp; / &szlig; etc.)
  const cleaned = s
    .toLowerCase()
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[ßäöü]/g, (ch) => ({ 'ß': 'ss', 'ä': 'a', 'ö': 'o', 'ü': 'u' } as Record<string, string>)[ch] ?? ch);
  return cleaned.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
}

/** Token-level overlap between a host keyword phrase and the candidate text.
 *  Splits the host phrase into 3+ char tokens, drops generic stop words like
 *  'car' / 'and', and requires every remaining token to appear in the
 *  candidate text. So 'Car interior accessories' still hits a candidate
 *  whose keyword reads 'Car Interior & Exterior Accessories'.
 *  Returns the shared host keywords + a score boost (0 – 2.0).           */
export function computeKeywordOverlap(
  candidateText: string | null | undefined,
  hostKeywords: string[] | null | undefined,
): KeywordOverlapResult {
  if (!candidateText || !hostKeywords?.length) {
    return { shared: [], count: 0, boost: 0 };
  }
  const candidateTokens = new Set(tokenize(candidateText));
  if (candidateTokens.size === 0) return { shared: [], count: 0, boost: 0 };

  const shared: string[] = [];
  for (const kw of hostKeywords) {
    const norm = (kw || '').trim();
    if (!norm) continue;
    const hostTokens = tokenize(norm).filter((t) => !STOP_TOKENS.has(t));
    if (hostTokens.length === 0) continue;
    const allHit = hostTokens.every((t) => candidateTokens.has(t));
    if (allHit) shared.push(norm);
  }
  const boost = Math.min(2.0, shared.length * 0.7);
  return { shared, count: shared.length, boost };
}

export function recommend(
  args: {
    name: string | null | undefined;
    email: string | null | undefined;
    website: string | null | undefined;
    countryIso: string | null | undefined;
  },
  mailType: MailType,
  score: number,
): Recommendation {
  const name = (args.name || '').toLowerCase();
  const email = (args.email || '').toLowerCase();
  const website = (args.website || '').toLowerCase();
  const haystack = `${name} ${email} ${website}`;
  const country = (args.countryIso || '').toUpperCase();
  const inPilotDePl = country === 'DE' || country === 'DEU' || country === 'PL' || country === 'POL';

  const suspicious = SUSPICIOUS_CATEGORY_TOKENS.find((t) => haystack.includes(t));
  if (suspicious) {
    return {
      action: 'RESEARCH',
      badge: '🔍 Önce araştır',
      reasoning: `Web sitesinde '${suspicious}' geçiyor — kategori dışı olabilir. 30 sn web kontrol et.`,
    };
  }

  if (score >= 8.0 && (mailType === 'personal_fl' || mailType === 'personal_il') && inPilotDePl) {
    return {
      action: 'APPROVE_FAVORITE',
      badge: '⭐ Onayla + Favori',
      reasoning: 'Sıcak aday: karar verici e-postası bulundu, pilot pazarda. Kişiselleştirilmiş mail + Calendly daveti.',
    };
  }

  if (score >= 7.5 && (mailType === 'personal_fl' || mailType === 'personal_il' || mailType === 'personal_dept')) {
    return {
      action: 'APPROVE_DIRECT',
      badge: '✅ Doğrudan onayla',
      reasoning: 'Karar verici e-postası bulundu, kategori sinyali güçlü. Onayla, mail kuyruğuna geç.',
    };
  }

  if (score >= 7.0 && mailType === 'personal_single') {
    return {
      action: 'APPROVE_DIRECT',
      badge: '✅ Doğrudan onayla',
      reasoning: 'Owner-led küçük firma profili. Şahsi e-posta — kısa, sade mail iyi sonuç verir.',
    };
  }

  if (score >= 6.5 && (mailType === 'personal_fl' || mailType === 'personal_il' || mailType === 'personal_single')) {
    return {
      action: 'APPROVE_WITH_REVIEW',
      badge: '🟡 Kontrol et, onayla',
      reasoning: 'Mail sahsi ama kategori uyumu net değil. Web sitesinde paspas/aksesuar/distribütör sinyali ara.',
    };
  }

  if (mailType === 'generic' && score >= 5.5) {
    return {
      action: 'LOW_PRIORITY',
      badge: '📭 Düşük öncelik',
      reasoning: 'Generic e-posta (info@/sales@) — yanıt potansiyeli düşük ama ek maliyet yok. Toplu mail\'e dahil et.',
    };
  }

  if (mailType === 'generic' && positiveHit(args.name)) {
    return {
      action: 'RESEARCH',
      badge: '🔍 Önce araştır',
      reasoning: 'Firma adında distribütör sinyali var ama mail generic. Web aç, karar verici email ara.',
    };
  }

  if (score < 5.5 && (mailType === 'generic' || mailType === 'other')) {
    return {
      action: 'REJECT',
      badge: '❌ Reddet',
      reasoning: 'Düşük skor + generic mail. Yanıt potansiyeli minimum, vakit kaybetmeye değmez.',
    };
  }

  return {
    action: 'LOW_PRIORITY',
    badge: '📭 Düşük öncelik',
    reasoning: 'Standart aday — toplu kampanyada değerlendirilir.',
  };
}

const COUNTRY_NAME_TR: Record<string, string> = {
  DE: 'Almanya', DEU: 'Almanya',
  PL: 'Polonya', POL: 'Polonya',
  FR: 'Fransa', FRA: 'Fransa',
  NL: 'Hollanda', NLD: 'Hollanda',
  AT: 'Avusturya', AUT: 'Avusturya',
  IT: 'İtalya', ITA: 'İtalya',
  ES: 'İspanya', ESP: 'İspanya',
  BE: 'Belçika', BEL: 'Belçika',
  CZ: 'Çekya', CZE: 'Çekya',
  GB: 'İngiltere', UK: 'İngiltere',
};

const MAIL_DESC: Record<MailType, string> = {
  personal_fl: 'Karar verici e-postası bulundu (sahsi format)',
  personal_il: 'Karar verici e-postası bulundu (kısa format)',
  personal_dept: 'Departman e-postası — satınalma/kategori muhtemel',
  personal_role: 'Rol-bazlı e-posta',
  personal_single: 'Şahsi e-posta — muhtemel küçük firma sahibi',
  generic: 'Generic e-posta — düşük yanıt potansiyeli',
  other: 'E-posta tipi belirsiz',
  none: 'E-posta bulunamadı',
};

export function buildSummary(args: {
  name: string;
  city: string | null | undefined;
  countryIso: string | null | undefined;
  hall: string | null | undefined;
  booth: string | null | undefined;
  fairName: string | null | undefined;
  mailType: MailType;
  score: number;
}): string {
  const country = COUNTRY_NAME_TR[(args.countryIso || '').toUpperCase()] || args.countryIso || '?';
  const city = args.city || '';
  const booth = args.booth || '?';
  const hall = args.hall || '?';
  const mailDesc = MAIL_DESC[args.mailType];
  const posSignal = positiveHit(args.name) ? ' Adında distribütör/handel/wholesale sinyali var.' : '';
  const fair = args.fairName || 'Fuar';

  return `${city ? `${city}, ` : ''}${country}. Hall ${hall} Stand ${booth}. ${mailDesc}.${posSignal} ${fair} katılımcısı. Skor: ${args.score}/10.`;
}
