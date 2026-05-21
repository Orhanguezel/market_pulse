#!/usr/bin/env python3
"""
Automechanika 2026 K-1 pilot exhibitor listesini market_pulse DB'ye yükler.
- /tmp/automechanika_exhibitors_*/exhibitors.jsonl ham verisinden okur
- ICP filtre v2 mantığını uygular (rakip + kategori dışı eler)
- lead_search_jobs satırı oluşturur
- lead_candidates'a INSERT eder
- Admin panel /admin/market/lead-machine/fair/review'da görünür hale getirir
"""

import json
import re
import os
import sys
import uuid
import subprocess

# --- Config -----------------------------------------------------------------

JSONL_PATH = '/tmp/automechanika_429.jsonl'  # Hall 3.0/3.1/4.0 — jq -c ile JSONL'e dönüştürüldü
ICP_UUID = '9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0'  # Automechanika 2026 ICP
JOB_PARAMS = {
    'fair_name': 'Automechanika Frankfurt 2026',
    'fair_url': 'https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html',
    'fair_date': '2026-09-08',
    'hall_filter': '3.0,3.1,4.0',
    'source': 'claude-csv-import-v2',
}

# DB bağlantısı backend/.env'den
ROOT = '/home/orhan/Documents/Projeler/market_pulse/backend'
ENV_FILE = f'{ROOT}/.env'


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


# --- ICP filtre v2 (Sprint 1 precision raporu mantığı) -----------------------

EXCLUDE_NAME_PATTERNS = [
    r'\be\.?\s*v\.?\b', r'\bassociation\b', r'\bverband\b',
    r'\bbattery\b', r'\bakku\b',
    r'\blubricant\b', r'\bschmierstoff\b', r'\boil\b',
    r'\btire\b', r'\breifen\b',
    r'\blighting\b', r'\bbeleuchtung\b', r'\blamp\b',
    r'\bcooling\b', r'\bkühlung\b',
    r'\bwelding\b', r'\bschweißen\b',
    r'\btrailer\b', r'\banhänger\b',
    r'\bpaint\b', r'\black\b',
    r'\binsurance\b', r'\bversicherung\b',
    r'\bsoftware\b', r'\bsap\b', r'\bcatalog\b', r'\bdaten\b',
    r'\blogistic\b', r'\bspedition\b',
    r'\bmarketing\b', r'\bmedia\b',
    r'\bperfume\b', r'\bduft\b', r'\bair freshen\b',
    r'\bmarderab',
    r'\bsuspension\b', r'\bbremse\b', r'\bbrake\b',
    r'\bpowertrain\b', r'\balternator\b', r'\bstarter motor\b',
    r'\bdichtung\b', r'\bautotechnik\b',
    r'\bthyssenkrupp\b', r'\bschaeffler\b', r'\bbosch\b', r'\bvalvoline\b',
    r'\bcontinental\b', r'\bzf\b', r'\bdenso\b', r'\bhitachi\b', r'\bdana\b',
    r'\bastemo\b', r'\bborgwarner\b', r'\bjtekt\b',
    r'\bmützer\b', r'\bmüitzer\b', r'\bmuetzer\b',
    r'\bcartelligence\b', r'\bdvse\b', r'\bfleetni\b', r'\btopmotive\b',
    r'\bglobal one\b',
    r'\bcompressor\b', r'\bkompressor\b',
    r'\bsteering\b', r'\blenkung\b',
    r'\bturbo\b', r'\bturbolader\b',
    r'\bgasket\b', r'\bdichtungssatz\b',
    r'\bclutch\b', r'\bkupplung\b',
    r'\bfilter\b',
    r'\bwindshield\b', r'\bglas\b.*windshield',
    r'\baudio\b',
    r'\bsecurity\b.*system',
    r'\bdiagnos\b',
    # Avrasya'nın rakipleri
    r'\bpaspas\b', r'\baksesuari\b', r'\bfrogum\b', r'\bclimair\b',
    r'\babsorpower\b', r'\baldoc\b', r'\bautodap\b',
]

PILOT_COUNTRIES = {'DEU', 'POL', 'AUT', 'NLD', 'FRA'}
EXCLUDE_COUNTRIES = {'TUR', 'CHN', 'HKG', 'IND', 'PAK', 'BGD', 'VNM', 'THA'}

POSITIVE_KEYWORDS = [
    'distrib', 'wholesale', 'großhandel', 'grosshandel', 'handel', 'handels',
    'import', 'export', 'trading',
    'aftermarket', 'accessor', 'aksesuar',
    'mat ', 'fußmat', 'tapis',
    'interior', 'innenraum',
    'tuning', 'styling',
]

ISO_3_TO_2 = {
    'DEU': 'DE', 'POL': 'PL', 'AUT': 'AT', 'NLD': 'NL', 'FRA': 'FR',
    'TUR': 'TR', 'ITA': 'IT', 'ESP': 'ES', 'GBR': 'GB', 'BEL': 'BE',
    'CZE': 'CZ', 'HUN': 'HU', 'SVK': 'SK', 'ROU': 'RO', 'SWE': 'SE',
    'DNK': 'DK', 'CHE': 'CH', 'BGR': 'BG', 'GRC': 'GR', 'PRT': 'PT',
}

def iso3_to_2(c):
    return ISO_3_TO_2.get(c, c[:2] if c else None)

def classify_mail(email):
    """
    Mail tipini sınıflandırır:
      personal_fl   — peter.schmidt@      (en değerli, karar verici sinyali)
      personal_il   — p.schmidt@          (initial+lastname)
      personal_dept — purchasing@         (departman, karar verici yakın)
      personal_role — k.giertz@           (rol-based, mid)
      personal_single — peter@            (küçük firma owner)
      generic       — info@/sales@/info-firma@  (düşük öncelik)
    """
    if not email:
        return 'none'
    local = email.split('@')[0].lower()

    # Departman mail'leri — karar verici yakın
    DEPT = {'purchasing','einkauf','procurement','satinalma','achat',
            'category','aftermarket','accessories','distribution'}
    if local in DEPT:
        return 'personal_dept'

    # Generic mail'leri — info, sales, kontakt, info-firma, mail@ vb.
    GENERIC = {'info','office','contact','sales','export','kontakt','biuro','service',
               'marketing','vertrieb','verkauf','mail','kundenservice','admin','team','hello',
               'support','reception','enquiry','enquiries','sekretariat','sekretariat',
               'reach','reachable','feedback','firma'}
    if local in GENERIC:
        return 'generic'
    # info-firma@, info_firma@, sales-export@ gibi pattern'ler de generic
    if re.match(r'^(info|sales|office|contact|export|kontakt)[-._]', local):
        return 'generic'

    # firstname.lastname@ — en değerli
    if re.match(r'^[a-z]+\.[a-z]+$', local):
        return 'personal_fl'

    # p.hessels@ veya k.giertz@ — initial+lastname
    if re.match(r'^[a-z]\.[a-z]+$', local):
        return 'personal_il'

    # ser.exp@, dev.ops@ — abbreviated role
    if re.match(r'^[a-z]{2,4}\.[a-z]{2,4}$', local):
        return 'personal_role'

    # peter@ — tek isim
    if re.match(r'^[a-z]+$', local):
        return 'personal_single'

    # firstname_lastname@ veya peter123@
    if re.match(r'^[a-z]+[._][a-z]+$', local):
        return 'personal_fl'

    return 'other'

# Domain icinde substring olarak (word boundary YOK) aranan kategori dısı kelimeler
# Ornek: reachcooling.com -> 'cooling' substring'i match eder
DOMAIN_SUBSTRING_EXCLUDE = [
    'cooling', 'battery', 'lighting', 'lubricant', 'tire', 'reifen', 'oil',
    'brake', 'gasket', 'powertrain', 'starter', 'alternator', 'compressor',
    'kompressor', 'steering', 'lenkung', 'turbo', 'clutch', 'kupplung',
    'filter', 'windshield', 'audio', 'diagnos', 'welding', 'paint', 'lack',
    'trailer', 'anhanger', 'logistic', 'spedition', 'insurance', 'versicherung',
    'fragrance', 'perfume', 'duft',
]


def excluded(name, email='', website=''):
    """Firma adı + mail domain + website domain üçünde pattern arar."""
    name_l = (name or '').lower()
    haystack = name_l + ' ' + (email or '').lower() + ' ' + (website or '').lower()

    # 1) Word-boundary regex (firma adı odaklı)
    for pat in EXCLUDE_NAME_PATTERNS:
        if re.search(pat, haystack):
            return True

    # 2) Domain substring eleme (reachcooling.com, autotrailers.de gibi)
    domain_text = ((email or '') + ' ' + (website or '')).lower()
    for token in DOMAIN_SUBSTRING_EXCLUDE:
        if token in domain_text:
            return True

    return False

def positive_hit(name):
    n = name.lower()
    return any(k in n for k in POSITIVE_KEYWORDS)

def compute_score(rec, mail_type):
    base = {
        'personal_fl': 7.5,
        'personal_il': 7.2,
        'personal_dept': 7.0,
        'personal_role': 6.8,
        'personal_single': 6.5,
        'generic': 5.5,
        'other': 6.0,
        'none': 4.0,
    }[mail_type]
    score = base
    if positive_hit(rec['name']):
        score += 1.0
    if rec.get('country') in ('DEU', 'POL'):
        score += 0.3
    return min(10.0, round(score, 1))


SUSPICIOUS_CATEGORY_TOKENS = [
    'cooling','battery','lighting','lubricant','tire','reifen','oil',
    'brake','gasket','powertrain','starter','alternator','filter',
    'audio','diagnos','welding','paint','trailer','clutch','steering',
    'turbo','windshield','glas','suspension','fragrance','perfume',
]


def recommend(rec, mail_type, score, positive):
    """
    Sistemin aday için aksiyon önerisi.

    Çıktı: (action, badge, reasoning)
      action: APPROVE_DIRECT | APPROVE_FAVORITE | RESEARCH | LOW_PRIORITY | REJECT
      badge:  Kart üstünde gösterilen emoji + label
      reasoning: 1 cümle Türkçe açıklama
    """
    name_l = (rec.get('name') or '').lower()
    email = (rec.get('email') or '').lower()
    website = (rec.get('website') or '').lower()
    haystack = name_l + ' ' + email + ' ' + website
    country = rec.get('country', '')

    # Şüpheli kategori sinyali (kategori dışı olabilir ama filtreye takılmamış)
    suspicious = [t for t in SUSPICIOUS_CATEGORY_TOKENS if t in haystack]

    # 1. RESEARCH — şüpheli kategori → web kontrol gerek
    if suspicious:
        return (
            'RESEARCH',
            '🔍 Önce araştır',
            f"Web sitesinde '{suspicious[0]}' geçiyor — kategori dışı olabilir. 30 sn web kontrol et."
        )

    # 2. APPROVE_FAVORITE — yüksek skor + sahsi mail + Polonya/Almanya
    if score >= 8.0 and mail_type in ('personal_fl','personal_il') and country in ('DEU','POL'):
        return (
            'APPROVE_FAVORITE',
            '⭐ Onayla + Favori',
            "Sıcak aday: karar verici e-postası bulundu, pilot pazarda. Kişiselleştirilmiş mail + Calendly daveti."
        )

    # 3. APPROVE_DIRECT — yüksek skor + sahsi mail
    if score >= 7.5 and mail_type in ('personal_fl','personal_il','personal_dept'):
        return (
            'APPROVE_DIRECT',
            '✅ Doğrudan onayla',
            "Karar verici e-postası bulundu, kategori sinyali güçlü. Onayla, mail kuyruğuna geç."
        )

    # 4. APPROVE_DIRECT — yüksek skor + tek isim (owner-led küçük firma)
    if score >= 7.0 and mail_type == 'personal_single':
        return (
            'APPROVE_DIRECT',
            '✅ Doğrudan onayla',
            "Owner-led küçük firma profili. Şahsi e-posta — kısa, sade mail iyi sonuç verir."
        )

    # 5. APPROVE_WITH_REVIEW — orta skor + sahsi mail, kategori belirsiz
    if score >= 6.5 and mail_type in ('personal_fl','personal_il','personal_single'):
        return (
            'APPROVE_WITH_REVIEW',
            '🟡 Kontrol et, onayla',
            "Mail sahsi ama kategori uyumu net değil. Web sitesinde paspas/aksesuar/distribütör sinyali ara."
        )

    # 6. LOW_PRIORITY — generic mail, orta skor
    if mail_type == 'generic' and score >= 5.5:
        return (
            'LOW_PRIORITY',
            '📭 Düşük öncelik',
            "Generic e-posta (info@/sales@) — yanıt potansiyeli düşük ama ek maliyet yok. Toplu mail'e dahil et."
        )

    # 7. RESEARCH — pozitif sinyal var ama generic mail
    if mail_type == 'generic' and positive:
        return (
            'RESEARCH',
            '🔍 Önce araştır',
            "Firma adında distribütör sinyali var ama mail generic. Web aç, karar verici email ara."
        )

    # 8. REJECT — düşük skor + generic
    if score < 5.5 and mail_type in ('generic', 'other'):
        return (
            'REJECT',
            '❌ Reddet',
            "Düşük skor + generic mail. Yanıt potansiyeli minimum, vakit kaybetmeye değmez."
        )

    # Default
    return (
        'LOW_PRIORITY',
        '📭 Düşük öncelik',
        "Standart aday — toplu kampanyada değerlendirilir."
    )


def build_summary(rec, mail_type, score):
    """Daha bilgilendirici Türkçe özet."""
    country_map = {
        'DEU': 'Almanya', 'POL': 'Polonya', 'FRA': 'Fransa',
        'NLD': 'Hollanda', 'AUT': 'Avusturya',
    }
    country = country_map.get(rec.get('country', ''), rec.get('country', '?'))
    city = rec.get('city', '') or ''
    booth = rec.get('booth_number', '?')
    hall = rec.get('hall_filter', '?')

    mail_desc = {
        'personal_fl': 'Karar verici e-postası bulundu (sahsi format)',
        'personal_il': 'Karar verici e-postası bulundu (kısa format)',
        'personal_dept': 'Departman e-postası — satınalma/kategori muhtemel',
        'personal_role': 'Rol-bazlı e-posta',
        'personal_single': 'Şahsi e-posta — muhtemel küçük firma sahibi',
        'generic': 'Generic e-posta — düşük yanıt potansiyeli',
    }.get(mail_type, 'E-posta tipi belirsiz')

    pos_signal = ''
    if positive_hit(rec['name']):
        pos_signal = ' Adında distribütör/handel/wholesale sinyali var.'

    return (
        f"{city}, {country}. Hall {hall} Stand {booth}. "
        f"{mail_desc}.{pos_signal} "
        f"Automechanika Frankfurt 2026 katılımcısı, K-1 pilot pazarda. "
        f"Skor: {score}/10."
    )


# --- Main -------------------------------------------------------------------

def filter_records():
    rows = []
    with open(JSONL_PATH) as f:
        for line in f:
            d = json.loads(line)
            country = d.get('country', '')
            if country in EXCLUDE_COUNTRIES:
                continue
            if country not in PILOT_COUNTRIES:
                continue
            if not d.get('email'):
                continue
            if excluded(d['name'], d.get('email', ''), d.get('website', '')):
                continue
            mail_type = classify_mail(d.get('email'))
            score = compute_score(d, mail_type)
            rows.append({
                'source_record': d,
                'mail_type': mail_type,
                'score': score,
            })
    return rows


def sql_escape(s):
    if s is None:
        return 'NULL'
    if isinstance(s, (int, float)):
        return str(s)
    s = str(s).replace('\\', '\\\\').replace("'", "''")
    return f"'{s}'"


def main():
    env = read_env()

    rows = filter_records()
    print(f'Filtre sonrasi: {len(rows)} aday')

    # 1) lead_search_jobs satiri
    job_id = str(uuid.uuid4())
    params_json = json.dumps(JOB_PARAMS).replace("'", "''")

    sql_lines = [
        f"INSERT INTO lead_search_jobs (id, channel, status, icp_id, params, result_count, started_at, finished_at) "
        f"VALUES ('{job_id}', 'trade_fair', 'done', '{ICP_UUID}', '{params_json}', {len(rows)}, NOW(), NOW());"
    ]

    # 2) lead_candidates
    seen_emails = set()
    inserted = 0
    for r in rows:
        d = r['source_record']
        email = d.get('email')
        if not email or email.lower() in seen_emails:
            continue
        seen_emails.add(email.lower())

        cand_id = str(uuid.uuid4())
        action, badge, reasoning = recommend(
            d, r['mail_type'], r['score'], positive_hit(d['name'])
        )
        raw_data = {
            'source': 'messefrankfurt_api',
            'fair_info': {
                'fair_name': 'Automechanika Frankfurt 2026',
                'fair_date': '2026-09-08',
                'hall': d.get('hall_filter'),
                'booth_number': d.get('booth_number'),
                'detail_url': d.get('detail_url'),
                'is_neighbor': False,
            },
            'exhibitor': {
                'name': d.get('name'),
                'website': d.get('website'),
                'syn_id': d.get('syn_id'),
            },
            'mail_classification': {
                'type': r['mail_type'],
                'classified_at': '2026-05-21T00:00:00Z',
            },
            'recommendation': {
                'action': action,
                'badge': badge,
                'reasoning': reasoning,
            },
            'imported_from': 'claude-csv-v3-2026-05-21',
        }
        raw_data_json = json.dumps(raw_data, ensure_ascii=False).replace("\\", "\\\\").replace("'", "''")

        ai_summary = build_summary(d, r['mail_type'], r['score'])
        ai_summary_sql = ai_summary.replace("'", "''")

        sql_lines.append(
            f"INSERT INTO lead_candidates "
            f"(id, job_id, channel, icp_id, status, name, website, country, city, phone, email, "
            f"raw_data, ai_summary, lead_score) "
            f"VALUES ("
            f"'{cand_id}', "
            f"'{job_id}', "
            f"'trade_fair', "
            f"'{ICP_UUID}', "
            f"'pending', "
            f"{sql_escape(d.get('name'))}, "
            f"{sql_escape(d.get('website'))}, "
            f"{sql_escape(iso3_to_2(d.get('country')))}, "
            f"{sql_escape(d.get('city'))}, "
            f"{sql_escape(d.get('phone'))}, "
            f"{sql_escape(email)}, "
            f"'{raw_data_json}', "
            f"'{ai_summary_sql}', "
            f"{r['score']}"
            f");"
        )
        inserted += 1

    # SQL'i dosyaya yaz
    sql_file = '/tmp/automechanika-import.sql'
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('SET NAMES utf8mb4;\n')
        f.write('\n'.join(sql_lines))
    print(f'SQL dosyasi yazildi: {sql_file} ({inserted+1} statement)')

    # mysql'e bas
    env_db = {**os.environ}
    cmd = [
        'mysql',
        '-u', env['DB_USER'],
        f'-p{env["DB_PASSWORD"]}',
        '-h', env['DB_HOST'],
        '-P', env['DB_PORT'],
        '--protocol=TCP',
        '--default-character-set=utf8mb4',
        env['DB_NAME'],
    ]
    with open(sql_file, 'rb') as f:
        result = subprocess.run(cmd, stdin=f, capture_output=True)
    if result.returncode != 0:
        print('HATA:', result.stderr.decode())
        sys.exit(1)
    print(f'DB import tamam.')
    print(f'  job_id: {job_id}')
    print(f'  inserted candidates: {inserted}')


if __name__ == '__main__':
    main()
