#!/usr/bin/env python3
"""
Mail taslak üretimi — outreach_campaigns tablosundan dinamik config çeker.

Kullanım:
  python3 scripts/generate-outreach-drafts.py [campaign-slug]

Varsayılan slug: 'avrasya-automechanika-2026'

Akış:
  1. outreach_campaigns tablosundan campaign çek (brand, sender, fair, vs.)
  2. ICP'ye bağlı APPROVE_DIRECT + APPROVE_FAVORITE adaylarını çek
  3. Her birini status='approved' yap
  4. Mail taslağı üret (campaign config + country→lang mapping + fallback personalization)
  5. lead_outreach_drafts'a INSERT (campaign_id ilişkili)

Bu script SaaS yapıdadır — Avrasya dışı kampanyalar için aynı tablo yapısıyla çalışır.
"""

import sys
import os
import re
import uuid
import json
import subprocess

ROOT = '/home/orhan/Documents/Projeler/market_pulse/backend'
ENV_FILE = f'{ROOT}/.env'
DEFAULT_SLUG = 'avrasya-automechanika-2026'
AUTO_APPROVE_ACTIONS = ('APPROVE_FAVORITE', 'APPROVE_DIRECT')


def read_env():
    env = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k] = v
    return env


def mysql_query(env, query, return_rows=True):
    """Helper — mysql --batch ile sorgu çalıştır."""
    cmd = [
        'mysql', '-u', env['DB_USER'], f'-p{env["DB_PASSWORD"]}',
        '-h', env['DB_HOST'], '-P', env['DB_PORT'], '--protocol=TCP',
        '--batch', '--skip-column-names', '--default-character-set=utf8mb4',
        env['DB_NAME'], '-e', query,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"MySQL hata: {result.stderr}")
    if not return_rows:
        return None
    return [line.split('\t') for line in result.stdout.strip().split('\n') if line.strip()]


def mysql_exec(env, sql_text):
    """Yazma sorguları için."""
    cmd = [
        'mysql', '-u', env['DB_USER'], f'-p{env["DB_PASSWORD"]}',
        '-h', env['DB_HOST'], '-P', env['DB_PORT'], '--protocol=TCP',
        '--default-character-set=utf8mb4', env['DB_NAME'],
    ]
    result = subprocess.run(cmd, input=sql_text, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"MySQL yazma hatası: {result.stderr}")


def fetch_campaign(env, slug):
    """outreach_campaigns'tan tek kayıt — dict olarak döner."""
    rows = mysql_query(env, f"""
SELECT id, slug, name, brand_name, brand_short, brand_legal,
       sender_label, sender_name, sender_title,
       sender_email, reply_to_email, sender_phone, sender_office,
       sender_website, sender_address,
       product_en, product_de, product_tr,
       fair_name, fair_edition,
       fair_dates_en, fair_dates_de, fair_dates_tr,
       fair_hall, fair_booth,
       calendly_link, calendly_placeholder,
       icp_id, default_lang, country_to_lang
FROM outreach_campaigns
WHERE slug='{slug}' AND is_active=1
LIMIT 1
""")
    if not rows:
        raise RuntimeError(f"Campaign bulunamadi: {slug}")
    cols = [
        'id','slug','name','brand_name','brand_short','brand_legal',
        'sender_label','sender_name','sender_title',
        'sender_email','reply_to_email','sender_phone','sender_office',
        'sender_website','sender_address',
        'product_en','product_de','product_tr',
        'fair_name','fair_edition',
        'fair_dates_en','fair_dates_de','fair_dates_tr',
        'fair_hall','fair_booth',
        'calendly_link','calendly_placeholder',
        'icp_id','default_lang','country_to_lang',
    ]
    raw = dict(zip(cols, rows[0]))
    # NULL → None, country_to_lang JSON parse
    for k, v in list(raw.items()):
        if v == 'NULL':
            raw[k] = None
    if raw.get('country_to_lang'):
        try:
            raw['country_to_lang'] = json.loads(raw['country_to_lang'])
        except Exception:
            raw['country_to_lang'] = {}
    else:
        raw['country_to_lang'] = {}
    return raw


def pick_language(campaign, country):
    """Country (ISO 2) → mail dili."""
    mapping = campaign.get('country_to_lang') or {}
    return mapping.get(country, campaign.get('default_lang') or 'EN')


def guess_first_name(email):
    """firstname.lastname@firma.com → 'Firstname'"""
    if not email:
        return None
    local = email.split('@')[0].lower()
    m = re.match(r'^([a-z]+)\.[a-z]+$', local)
    if m:
        return m.group(1).capitalize()
    return None


# --- Mail body üretimi -------------------------------------------------------

PERSONALIZATION_FALLBACK = {
    'EN': {
        'DE': "We've seen your aftermarket programme covering the German market and noticed a clear product-range overlap with our line.",
        'PL': "We've noted your aftermarket activity in the Polish market and see a clear category overlap with our line.",
        'NL': "Your Netherlands-based aftermarket operation aligns with our distribution focus across the Benelux.",
        'FR': "Your aftermarket coverage in the French market overlaps clearly with our product line.",
        'DEFAULT': "We've reviewed your aftermarket coverage and see a clear product-range overlap with our line.",
    },
    'DE': {
        'DE': "Wir haben Ihr Aftermarket-Programm für den deutschen Markt gesehen und sehen klare Überschneidungen zu unserer Linie.",
        'AT': "Ihr Aftermarket-Engagement im österreichischen Markt zeigt klare Berührungspunkte zu unserer Linie.",
        'DEFAULT': "Wir haben Ihr Aftermarket-Programm gesehen und sehen klare Berührungspunkte zu unserer Linie.",
    },
    'TR': {
        'DEFAULT': "Aftermarket programınızı inceledik; ürün serimizle net bir örtüşme görüyoruz.",
    },
}


def get_subject(campaign, lang):
    fair = f"{campaign['fair_name']} {campaign['fair_edition']}".strip()
    if lang == 'EN':
        return f"{fair} - 10 min meeting? - {campaign['brand_name']}"
    if lang == 'DE':
        return f"{fair} - 10 Min Termin? - {campaign['brand_name']}"
    if lang == 'TR':
        return f"{fair} - 10 dk randevu? - {campaign['brand_name']}"
    return f"{fair} - meeting - {campaign['brand_name']}"


def get_signature(campaign):
    """Mail altı imza bloğu."""
    sender = campaign['sender_label'] or campaign['brand_name']
    contact = []
    if campaign.get('sender_website'):
        contact.append(campaign['sender_website'])
    if campaign.get('sender_email'):
        contact.append(campaign['sender_email'])
    if campaign.get('sender_phone'):
        contact.append(campaign['sender_phone'])
    return sender + '\n' + '  |  '.join(contact)


def build_body(campaign, lang, country, first_name):
    """3 dil için template fill."""
    salutation = {
        'EN': f"Dear {first_name}," if first_name else "Dear Sirs,",
        'DE': f"Sehr geehrte/r {first_name}," if first_name else "Sehr geehrte Damen und Herren,",
        'TR': f"Merhabalar {first_name}," if first_name else "Merhabalar,",
    }[lang]

    personalization = PERSONALIZATION_FALLBACK.get(lang, {}).get(country) \
        or PERSONALIZATION_FALLBACK.get(lang, {}).get('DEFAULT') \
        or PERSONALIZATION_FALLBACK['EN']['DEFAULT']

    product = {
        'EN': campaign.get('product_en') or '',
        'DE': campaign.get('product_de') or campaign.get('product_en') or '',
        'TR': campaign.get('product_tr') or campaign.get('product_en') or '',
    }[lang]

    fair = campaign['fair_name'] or ''
    fair_full = f"{fair} {campaign['fair_edition']}".strip() if campaign.get('fair_edition') else fair
    dates = {
        'EN': campaign.get('fair_dates_en') or '',
        'DE': campaign.get('fair_dates_de') or campaign.get('fair_dates_en') or '',
        'TR': campaign.get('fair_dates_tr') or campaign.get('fair_dates_en') or '',
    }[lang]
    hall = campaign.get('fair_hall') or ''
    booth = campaign.get('fair_booth') or ''
    location = f"Hall {hall}, Booth {booth}" if hall and booth else (booth or hall or 'our booth')

    calendly = campaign.get('calendly_link') or campaign.get('calendly_placeholder') or '[Calendly link]'
    brand = campaign.get('brand_name') or 'Our team'

    if lang == 'EN':
        body = (
            f"{salutation}\n\n"
            f"{personalization}\n\n"
            f"We're {brand}, a {product}. "
            f"We'll be at {fair_full} {dates}, {location}.\n\n"
            f"Would you have 10 minutes for an on-site meeting?\n\n"
            f"Calendar: {calendly}\n\n"
            f"Best regards,\n{get_signature(campaign)}"
        )
    elif lang == 'DE':
        body = (
            f"{salutation}\n\n"
            f"{personalization}\n\n"
            f"Wir sind {brand}, ein {product}. "
            f"Vom {dates} stehen wir auf der {fair_full} - {location}.\n\n"
            f"Hätten Sie 10 Minuten für einen Termin vor Ort?\n\n"
            f"Kalender: {calendly}\n\n"
            f"Mit freundlichen Grüßen,\n{get_signature(campaign)}"
        )
    else:  # TR
        body = (
            f"{salutation}\n\n"
            f"{personalization}\n\n"
            f"Biz {brand} olarak {product}. "
            f"{dates} arası {fair_full}'tayız — {location}.\n\n"
            f"10 dakikalık bir görüşme için müsait olur musunuz?\n\n"
            f"Takvim: {calendly}\n\n"
            f"Saygılarımla,\n{get_signature(campaign)}"
        )
    return body


def sql_escape(s):
    if s is None:
        return 'NULL'
    s = str(s).replace('\\', '\\\\').replace("'", "''")
    return f"'{s}'"


def main():
    slug = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SLUG
    env = read_env()
    campaign = fetch_campaign(env, slug)
    print(f"Kampanya: {campaign['name']}")
    print(f"  Marka: {campaign['brand_name']}")
    print(f"  Gönderici: {campaign['sender_email']}")
    print(f"  Fuar: {campaign['fair_name']} {campaign['fair_edition']} ({campaign['fair_hall']} {campaign['fair_booth']})")
    print(f"  ICP: {campaign['icp_id']}")
    print()

    # Adayları çek
    icp_filter = f"AND icp_id='{campaign['icp_id']}'" if campaign.get('icp_id') else ''
    rows = mysql_query(env, f"""
SELECT id, name, email, country,
       JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.recommendation.action')) AS action
FROM lead_candidates
WHERE channel='trade_fair'
  AND status IN ('pending','approved')
  AND email IS NOT NULL AND email != ''
  {icp_filter}
  AND JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.recommendation.action')) IN ('APPROVE_FAVORITE','APPROVE_DIRECT')
""")
    print(f"Bulunan aday: {len(rows)} (APPROVE_FAVORITE + APPROVE_DIRECT)")

    if not rows:
        print("Aday yok.")
        return

    # SQL hazırla
    sql_lines = ['SET NAMES utf8mb4;']
    approved = 0
    drafted = 0
    for r in rows:
        cand_id, name, email, country, action = r[0], r[1], (r[2] if r[2] != 'NULL' else None), r[3], r[4]
        if not email:
            continue

        sql_lines.append(f"UPDATE lead_candidates SET status='approved', reviewed_at=NOW() WHERE id='{cand_id}';")
        approved += 1

        lang = pick_language(campaign, country or '')
        first_name = guess_first_name(email)
        subject = get_subject(campaign, lang)
        body = build_body(campaign, lang, country or '', first_name)
        draft_id = str(uuid.uuid4())
        sql_lines.append(
            f"INSERT INTO lead_outreach_drafts "
            f"(id, candidate_id, campaign_id, subject, body, ai_model, status) "
            f"VALUES ('{draft_id}', '{cand_id}', '{campaign['id']}', "
            f"{sql_escape(subject)}, {sql_escape(body)}, 'template-dynamic-v2', 'draft');"
        )
        drafted += 1

    mysql_exec(env, '\n'.join(sql_lines))
    print(f"Otomatik onaylanan: {approved}")
    print(f"Mail taslağı üretilen: {drafted}")


if __name__ == '__main__':
    main()
