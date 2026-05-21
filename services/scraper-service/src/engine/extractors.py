import hashlib
import json
import re
from typing import Any
from urllib.parse import urljoin, urlparse

from scrapling.parser import Selector

AI_CRAWLERS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "anthropic-ai",
    "PerplexityBot",
    "CCBot",
    "Bytespider",
    "cohere-ai",
    "Google-Extended",
    "GoogleOther",
    "Applebot-Extended",
    "FacebookBot",
    "Amazonbot",
]

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
]


def _text(value: Any) -> str | None:
    return str(value).strip() if value is not None and str(value).strip() else None


def _attrs(node: Any) -> dict[str, Any]:
    try:
        return dict(node.attrib)
    except Exception:
        return {}


def _css_texts(sel: Selector, selector: str) -> list[str]:
    return [str(item).strip() for item in sel.css(selector).getall() if str(item).strip()]


def _first(sel: Selector, selector: str) -> str | None:
    return _text(sel.css(selector).get(default=None))


def _header_value(headers: dict[str, Any], name: str) -> Any:
    if name in headers:
        return headers[name]
    lower_name = name.lower()
    for key, value in headers.items():
        if str(key).lower() == lower_name:
            return value
    return None


def extract_basic_page_data(page: Any) -> dict[str, Any]:
    title = page.css("title::text").get(default=None)
    description = page.css('meta[name="description"]::attr(content)').get(default=None)
    canonical = page.css('link[rel="canonical"]::attr(href)').get(default=None)
    h1_tags = page.css("h1::text").getall()
    structured_data: list[Any] = []
    for raw in page.css('script[type="application/ld+json"]::text').getall():
        try:
            structured_data.append(json.loads(str(raw).strip()))
        except json.JSONDecodeError:
            continue
    return {
        "title": str(title) if title is not None else None,
        "description": str(description) if description is not None else None,
        "canonical": str(canonical) if canonical is not None else None,
        "h1_tags": [str(item) for item in h1_tags],
        "structured_data": structured_data,
    }


PHONE_RE = re.compile(r"(?:\+|00)?[0-9][0-9\s().\-/]{7,}[0-9]")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
B2B_TERMS = [
    "b2b",
    "wholesale",
    "distributor",
    "importer",
    "exporter",
    "private label",
    "oem",
    "odm",
    "bulk order",
    "toptan",
    "distribütör",
    "distributor",
    "ithalat",
    "ihracat",
    "bayi",
]
AUTOMOTIVE_TERMS = [
    "automotive",
    "auto accessories",
    "car accessories",
    "floor mats",
    "car mat",
    "cargo liner",
    "oto aksesuar",
    "oto paspas",
    "paspas",
    "bagaj havuzu",
]


def _visible_text(sel: Selector) -> str:
    return str(sel.get_all_text(separator=" ", strip=True, ignore_tags=("script", "style")))


def _json_ld(sel: Selector) -> list[Any]:
    items: list[Any] = []
    for raw in sel.css('script[type="application/ld+json"]::text').getall():
        try:
            parsed = json.loads(str(raw).strip())
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(parsed, list):
            items.extend(parsed)
        elif isinstance(parsed, dict) and isinstance(parsed.get("@graph"), list):
            items.extend(parsed["@graph"])
        else:
            items.append(parsed)
    return items


def _domain(url: str) -> str:
    return urlparse(url).netloc.replace("www.", "")


def _extract_contact(text: str) -> dict[str, list[str]]:
    emails = sorted(set(EMAIL_RE.findall(text)))
    phones = sorted({re.sub(r"\s+", " ", item).strip() for item in PHONE_RE.findall(text)})[:10]
    return {"emails": emails, "phones": phones}


def _link_records(sel: Selector, final_url: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    for link in sel.css("a[href]"):
        attrs = _attrs(link)
        href = urljoin(final_url, str(attrs.get("href", "")))
        if href in seen or not href.startswith(("http://", "https://")):
            continue
        seen.add(href)
        links.append({"url": href, "text": str(link.get_all_text(separator=" ", strip=True))})
    return links


def _social_profiles_from_links(links: list[dict[str, str]]) -> list[dict[str, str]]:
    patterns = {
        "facebook": r"(?:facebook\.com|fb\.com)/(?!sharer|share)",
        "instagram": r"instagram\.com/",
        "linkedin": r"linkedin\.com/(?:company|in)/",
        "youtube": r"youtube\.com/(?:channel|c|@|user)/",
        "x": r"(?:twitter\.com|x\.com)/(?!intent|share)",
        "tiktok": r"tiktok\.com/@",
    }
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in links:
        url = item["url"]
        for platform, pattern in patterns.items():
            if platform not in seen and re.search(pattern, url, re.I):
                out.append({"platform": platform, "url": url})
                seen.add(platform)
    return out


def _first_json_org(items: list[Any]) -> dict[str, Any]:
    for item in items:
        if not isinstance(item, dict):
            continue
        raw_type = item.get("@type")
        types = raw_type if isinstance(raw_type, list) else [raw_type]
        if any(t in {"Organization", "LocalBusiness", "Corporation", "Store"} for t in types):
            return item
    return {}


def extract_website_analysis(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    text = _visible_text(sel)
    lower_text = text.lower()
    links = _link_records(sel, final_url)
    json_ld = _json_ld(sel)
    org = _first_json_org(json_ld)
    contact = _extract_contact(text)
    b2b_signals = [term for term in B2B_TERMS if term in lower_text]
    product_signals = [term for term in AUTOMOTIVE_TERMS if term in lower_text]
    contact_links = [
        item for item in links
        if re.search(r"contact|about|iletisim|hakkimizda|impressum|kontakt", item["url"] + " " + item["text"], re.I)
    ][:10]
    return {
        "profile": "website-analysis",
        "url": url,
        "final_url": final_url,
        "domain": _domain(final_url),
        "title": _first(sel, "title::text"),
        "description": _first(sel, 'meta[name="description"]::attr(content)'),
        "company_name": org.get("name") or _first(sel, "h1::text") or _first(sel, "title::text"),
        "contact": contact,
        "social_profiles": _social_profiles_from_links(links),
        "b2b_signals": b2b_signals,
        "product_signals": product_signals,
        "is_likely_b2b": bool(b2b_signals),
        "sells_automotive_accessories": bool(product_signals),
        "private_label_signal": any(term in lower_text for term in ("private label", "oem", "odm", "özel marka")),
        "china_signal": any(term in lower_text for term in ("china", "çin", "import from china", "made in china")),
        "contact_links": contact_links,
        "structured_organization": org,
        "text": text[:8000],
    }


def _candidate_blocks(sel: Selector) -> list[Any]:
    selectors = [
        "article",
        ".company",
        ".company-card",
        ".listing",
        ".listing-item",
        ".result",
        ".result-item",
        ".supplier",
        ".exhibitor",
        ".exhibitor-card",
        ".card",
        "li",
    ]
    blocks: list[Any] = []
    seen_text: set[str] = set()
    for css in selectors:
        for node in sel.css(css):
            text = str(node.get_all_text(separator=" ", strip=True))
            if len(text) < 8 or text in seen_text:
                continue
            seen_text.add(text)
            blocks.append(node)
            if len(blocks) >= 120:
                return blocks
    return blocks


def _listing_from_node(node: Any, final_url: str) -> dict[str, Any] | None:
    text = str(node.get_all_text(separator=" ", strip=True))
    if len(text) < 8:
        return None
    link_sel = node.css("a[href]")
    link_node = link_sel.first if link_sel else None
    link = _attrs(link_node).get("href") if link_node else None
    website = urljoin(final_url, str(link)) if link else None
    name = _text(node.css("h1::text, h2::text, h3::text, a::text").get(default=None))
    if not name:
        name = text.split("  ")[0].split("\n")[0][:120].strip()
    contact = _extract_contact(text)
    return {
        "name": name,
        "website": website,
        "description": text[:1000],
        "email": contact["emails"][0] if contact["emails"] else None,
        "phone": contact["phones"][0] if contact["phones"] else None,
        "source_url": final_url,
    }


def extract_directory_listing(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    companies: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in _json_ld(sel):
        if not isinstance(item, dict):
            continue
        raw_type = item.get("@type")
        types = raw_type if isinstance(raw_type, list) else [raw_type]
        if not any(t in {"Organization", "LocalBusiness", "Store"} for t in types):
            continue
        name = _text(item.get("name"))
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        companies.append({
            "name": name,
            "website": item.get("url"),
            "description": item.get("description"),
            "email": item.get("email"),
            "phone": item.get("telephone"),
            "address": item.get("address"),
            "source_url": final_url,
        })
    for node in _candidate_blocks(sel):
        record = _listing_from_node(node, final_url)
        if not record or not record.get("name"):
            continue
        key = str(record["name"]).lower()
        if key in seen:
            continue
        seen.add(key)
        companies.append(record)
        if len(companies) >= 100:
            break
    return {
        "profile": "directory-listing",
        "url": url,
        "final_url": final_url,
        "count": len(companies),
        "companies": companies,
    }


def _booth_number(text: str) -> str | None:
    hall_stand = re.search(r"(?:hall|salon)\s*[:#-]?\s*([0-9]+\.[0-9]+)\s*(?:booth|stand|stant)?\s*([A-Z]\s*[-\s]?\d+)", text, re.I)
    if hall_stand:
        return f"{hall_stand.group(1)} {re.sub(r'\s+', '', hall_stand.group(2).upper())}"
    stand = re.search(r"(?:booth|stand|stant)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?\s*[A-Z]\s*[-\s]?\d+|[A-Z]?\d+[A-Z0-9.\-/]*)", text, re.I)
    if stand:
        return re.sub(r"\s+", " ", stand.group(1)).strip()
    hall = re.search(r"(?:hall|salon)\s*[:#-]?\s*([A-Z]?\d+[A-Z0-9.\-/]*)", text, re.I)
    return hall.group(1).strip() if hall else None


def _messefrankfurt_detail_url(href: str, final_url: str) -> str:
    absolute = urljoin(final_url, href)
    if ".detail.html/" in absolute:
        return absolute
    return absolute


def _extract_messefrankfurt_list(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    page_text = _visible_text(sel)
    exhibitors: list[dict[str, Any]] = []
    seen: set[str] = set()

    for link in sel.css('a[href*=".detail.html/"]'):
        href = str(_attrs(link).get("href", ""))
        detail_url = _messefrankfurt_detail_url(href, final_url)
        text = str(link.get_all_text(separator=" ", strip=True))
        name = (
            _text(link.css(".ex-exhibitor-search-result-item__headline span::text").get(default=None))
            or _text(link.css("h1::text, h2::text, h3::text, h4::text, a::text").get(default=None))
            or text.split("  ")[0].strip()
        )
        if not name:
            continue
        key = detail_url.lower()
        if key in seen:
            continue
        seen.add(key)
        description = _text(link.css(".ex-exhibitor-search-result-item__copy::text").get(default=None))
        booth = _text(link.css(".ex-exhibitor-search-result-item__location-text::text").get(default=None)) or _booth_number(text)
        if not booth and href:
            idx = html.find(href)
            if idx >= 0:
                booth = _booth_number(html[max(0, idx - 500) : idx + 1200])
        contact = _extract_contact(description or text)
        exhibitors.append({
            "name": name[:180],
            "website": None,
            "description": (description or text)[:1000],
            "email": contact["emails"][0] if contact["emails"] else None,
            "phone": contact["phones"][0] if contact["phones"] else None,
            "source_url": detail_url,
            "detail_url": detail_url,
            "booth_number": booth,
        })
        if len(exhibitors) >= 250:
            break

    return {
        "profile": "fair-exhibitor",
        "url": url,
        "final_url": final_url,
        "count": len(exhibitors),
        "exhibitors": exhibitors,
    }


def extract_fair_exhibitor(html: str, url: str, response: Any) -> dict[str, Any]:
    final_url = getattr(response, "url", url) or url
    if "automechanika.messefrankfurt.com" in urlparse(final_url).netloc:
        return _extract_messefrankfurt_list(html, url, response)

    sel = Selector(html or "", url=url)
    exhibitors: list[dict[str, Any]] = []
    seen: set[str] = set()
    for node in _candidate_blocks(sel):
        record = _listing_from_node(node, final_url)
        if not record or not record.get("name"):
            continue
        key = str(record["name"]).lower()
        if key in seen:
            continue
        seen.add(key)
        record["booth_number"] = _booth_number(str(record.get("description") or ""))
        record["detail_url"] = record.get("source_url")
        exhibitors.append(record)
        if len(exhibitors) >= 150:
            break
    return {
        "profile": "fair-exhibitor",
        "url": url,
        "final_url": final_url,
        "count": len(exhibitors),
        "exhibitors": exhibitors,
    }


def _json_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _labeled_value(text: str, labels: list[str]) -> str | None:
    stop_labels = [
        "Product groups", "Produktgruppen", "Brands", "Marken", "Target markets",
        "Zielmärkte", "Trade audience", "Besucherzielgruppen", "Hall", "Halle",
        "Salon", "Country", "Land", "City", "Ort",
    ]
    stop = "|".join(re.escape(label) for label in stop_labels)
    for label in labels:
        match = re.search(rf"{re.escape(label)}\s*[:\n]\s*(.+?)(?=\s+(?:{stop})\s*[:\n]|$)", text, re.I)
        if match:
            return match.group(1).strip()
    return None


def _keyword_list(text: str, labels: list[str]) -> list[str]:
    value = _labeled_value(text, labels)
    if not value:
        return []
    return [item.strip(" ,;") for item in re.split(r"[,;|]", value) if item.strip(" ,;")]


def extract_fair_exhibitor_detail(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    text = _visible_text(sel)
    json_ld = _json_ld(sel)
    org = _first_json_org(json_ld)
    if not org:
        for item in json_ld:
            if isinstance(item, dict) and isinstance(item.get("author"), dict):
                org = item["author"]
                break
    contact = _extract_contact(text)

    address = org.get("address")
    city: str | None = None
    country: str | None = None
    if isinstance(address, dict):
        city = _text(address.get("addressLocality"))
        country = _text(address.get("addressCountry"))
        address_text = ", ".join(
            item for item in [
                _text(address.get("streetAddress")),
                _text(address.get("postalCode")),
                city,
                country,
            ]
            if item
        ) or None
    else:
        address_text = _text(address)

    website = _text(sel.css("a.ex-contact-box__website-link::attr(href)").get(default=None)) or _text(org.get("url"))
    if website and not website.startswith(("http://", "https://")):
        website = f"https://{website}"
    if not website:
        for link in _link_records(sel, final_url):
            parsed = urlparse(link["url"])
            if "messefrankfurt.com" not in parsed.netloc and not re.search(r"facebook|linkedin|xing|twitter|mailto:", link["url"], re.I):
                website = link["url"]
                break

    booth = _booth_number(text)
    hall = None
    if booth:
        hall_match = re.match(r"([0-9]+(?:\.[0-9]+)?)\s+", booth)
        hall = hall_match.group(1) if hall_match else _labeled_value(text, ["Hall", "Halle", "Salon"])
    else:
        hall = _labeled_value(text, ["Hall", "Halle", "Salon"])

    description = _text(org.get("description")) or _first(sel, ".ex-detail-description p::text") or _first(sel, 'meta[name="description"]::attr(content)')
    if not description:
        paragraphs = [p for p in _css_texts(sel, "p::text") if len(p) > 40]
        description = paragraphs[0] if paragraphs else None
    keywords = [
        item.strip()
        for item in (_first(sel, 'meta[name="keywords"]::attr(content)') or "").split(",")
        if item.strip()
    ]

    return {
        "profile": "fair-exhibitor-detail",
        "url": url,
        "final_url": final_url,
        "name": _text(org.get("name")) or _first(sel, "h1::text") or _first(sel, "title::text"),
        "hall": hall,
        "booth": booth,
        "country": country or _labeled_value(text, ["Country", "Land"]),
        "city": city or _labeled_value(text, ["City", "Ort"]),
        "address": address_text,
        "website": website,
        "phone": _text(org.get("telephone")) or (contact["phones"][0] if contact["phones"] else None),
        "email": _text(org.get("email")) or (contact["emails"][0] if contact["emails"] else None),
        "product_groups": _json_list(org.get("makesOffer")) or _keyword_list(text, ["Product groups", "Produktgruppen"]) or keywords,
        "brands": _keyword_list(text, ["Brands", "Marken"]),
        "target_markets": _keyword_list(text, ["Target markets", "Zielmärkte"]),
        "description": description,
        "trade_audience": _keyword_list(text, ["Trade audience", "Besucherzielgruppen"]),
    }


FIRM_TYPE_TERMS = [
    "distributor", "importer", "wholesaler", "retailer", "manufacturer",
    "distribütör", "ithalatçı", "toptancı", "perakendeci", "üretici",
    "exporter", "ihracatçı", "supplier", "tedarikçi", "reseller", "bayi",
]

CHINA_TERMS = ["china", "çin", "made in china", "import from china", "çin malı"]
PRIVATE_LABEL_TERMS = ["private label", "white label", "özel marka", "oem", "odm"]

PRICE_RE = re.compile(r"(?:[€$₺£]\s*\d{1,6}[.,]\d{2}|\d{1,6}[.,]\d{2}\s*[€$₺£])")
CAMPAIGN_RE = re.compile(r"\b(?:sale|indirim|%\s*off|discount|kampanya|fırsat|outlet|clearance)\b", re.I)


def _currency_hint(price_text: str) -> str:
    for symbol, name in [("€", "EUR"), ("$", "USD"), ("₺", "TRY"), ("£", "GBP")]:
        if symbol in price_text:
            return name
    return "UNKNOWN"


def extract_lead_page(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    text = _visible_text(sel)
    lower_text = text.lower()
    links = _link_records(sel, final_url)
    contact = _extract_contact(text)

    tel_links = [
        str(a.attrib.get("href", "")).replace("tel:", "").strip()
        for a in sel.css("a[href^='tel:']")
        if str(a.attrib.get("href", "")).replace("tel:", "").strip()
    ]
    phones = sorted(set(contact["phones"] + tel_links))

    heading_texts = [str(t).strip() for t in sel.css("h1::text, h2::text, h3::text").getall() if str(t).strip()]
    nav_texts = [str(t).strip() for t in sel.css("nav a::text, header a::text").getall() if str(t).strip()]
    product_keywords = list(dict.fromkeys(heading_texts + nav_texts))[:50]

    return {
        "profile": "lead-page",
        "url": url,
        "final_url": final_url,
        "title": _first(sel, "title::text"),
        "description": _first(sel, 'meta[name="description"]::attr(content)'),
        "text_content": text[:8000],
        "has_b2b_signals": any(term in lower_text for term in B2B_TERMS),
        "has_china_signals": any(term in lower_text for term in CHINA_TERMS),
        "has_private_label": any(term in lower_text for term in PRIVATE_LABEL_TERMS),
        "contact_emails": contact["emails"],
        "contact_phones": phones,
        "social_profiles": _social_profiles_from_links(links),
        "firm_type_hints": [term for term in FIRM_TYPE_TERMS if term in lower_text],
        "product_keywords": product_keywords,
    }


def extract_competitor_page(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    text = _visible_text(sel)

    prices: list[dict[str, Any]] = []
    for match in PRICE_RE.findall(text)[:50]:
        idx = text.find(match)
        context = text[max(0, idx - 60) : idx + 60 + len(match)].strip()
        prices.append({"text": match.strip(), "context": context, "currency_hint": _currency_hint(match)})

    products: list[dict[str, Any]] = []
    for item in _json_ld(sel):
        if not isinstance(item, dict):
            continue
        raw_type = item.get("@type")
        types = raw_type if isinstance(raw_type, list) else [raw_type]
        if "Product" not in types:
            continue
        name = _text(item.get("name"))
        if not name:
            continue
        price: str | None = None
        offers = item.get("offers")
        if isinstance(offers, dict):
            price = str(offers.get("price", "")) or None
        elif isinstance(offers, list) and offers:
            price = str(offers[0].get("price", "")) or None
        products.append({"name": name, "price": price, "url": _text(item.get("url"))})

    if not products:
        for card in sel.css(".product, .product-card, [class*='product'], [class*='item']")[:30]:
            name = _text(card.css("h2::text, h3::text, .name::text, .title::text").get(default=None))
            if not name:
                continue
            price_el = _text(card.css(".price::text, [class*='price']::text").get(default=None))
            link = card.css("a[href]::attr(href)").get(default=None)
            products.append({
                "name": name,
                "price": price_el,
                "url": urljoin(final_url, str(link)) if link else None,
            })

    campaigns: list[str] = []
    seen_campaigns: set[str] = set()
    for node in sel.css("section, div, p, span, li"):
        node_text = str(node.get_all_text(separator=" ", strip=True))
        if len(node_text) > 500 or node_text in seen_campaigns:
            continue
        if CAMPAIGN_RE.search(node_text):
            seen_campaigns.add(node_text)
            campaigns.append(node_text)
            if len(campaigns) >= 20:
                break

    hash_input = json.dumps(
        {"prices": prices, "products": products[:20], "campaigns": campaigns[:10]}, sort_keys=True
    )
    content_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    return {
        "profile": "competitor-page",
        "url": url,
        "final_url": final_url,
        "title": _first(sel, "title::text"),
        "description": _first(sel, 'meta[name="description"]::attr(content)'),
        "prices": prices,
        "products": products[:50],
        "campaigns": campaigns,
        "content_hash": content_hash,
        "changed_fields": [],
    }


def extract_marketplace_store(html: str, url: str, response: Any) -> dict[str, Any]:
    """Extract a seller storefront snapshot from Hepsiburada / Trendyol / Amazon TR.

    Returns a normalized {products: [...], summary: {...}, platform: ...}
    payload that's easy to diff between snapshots.

    The shape is deliberately small and platform-agnostic: each product is
    {name, price, currency, url, out_of_stock, rating, reviews_count}.  Three
    things matter for our churn analysis:
      1. listing count (drop = supply problem)
      2. price drift (sustained drops = dealer trying to clear stock)
      3. out_of_stock ratio (rising = inventory failure)
    Anything richer (variants, descriptions) we can pull later with a
    follow-up scrape per product URL.
    """
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    host = (urlparse(final_url).netloc or "").lower()

    platform = "unknown"
    if "hepsiburada" in host: platform = "hepsiburada"
    elif "trendyol" in host:  platform = "trendyol"
    elif "amazon"   in host:  platform = "amazon"

    products: list[dict[str, Any]] = []

    # Hepsiburada: storefront uses React SSR. The real product tiles are
    # rendered as anchors whose href matches /<slug>-p-<HBC...>. The
    # `class*="productCard"` substring also catches generated CSS rule names,
    # which gave us hundreds of false-positive matches in earlier runs — so
    # we now anchor on the href pattern only. If the page hasn't hydrated
    # the product grid yet, the count will be 0 — accurate signal that the
    # scrape is incomplete rather than a phantom number.
    if platform == "hepsiburada":
        seen_hrefs: set[str] = set()
        for card in sel.css('a[href*="-p-HBC"], a[href*="-p-HBV"]')[:120]:
            href = card.attrib.get('href') or card.css('::attr(href)').get()
            if not href or href in seen_hrefs:
                continue
            seen_hrefs.add(href)
            name = (
                _text(card.attrib.get('title'))
                or _text(card.css('::attr(title)').get(default=None))
                or _text(card.css('h3::text, h2::text').get(default=None))
                or _text(card.css('span[title]::attr(title)').get(default=None))
                or _text(card.css('img::attr(alt)').get(default=None))
            )
            # Walk up the DOM tree a bit to find the price; product tile
            # containers wrap the anchor and the price together
            parent = card.xpath('..')
            price_text = (
                _text(card.css('[data-test-id="price-current-price"]::text').get(default=None))
                or (_text(parent.css('[data-test-id="price-current-price"]::text').get(default=None)) if parent else None)
                or _text(card.css('span:contains("TL")::text').get(default=None))
            )
            products.append({
                "name": name,
                "url": urljoin(final_url, href) if href else None,
                "price_text": price_text,
                "out_of_stock": bool(card.css('[class*="outOfStock"], [class*="tukendi"]')),
            })

    # Trendyol: product card layout
    elif platform == "trendyol":
        for card in sel.css(
            'div.p-card-wrppr, div[data-test-id="product-card"], '
            'div.product-card, a[href*="/sr/"][data-id]'
        )[:120]:
            name = _text(card.css('.prdct-desc-cntnr-name::text, span.prdct-desc-cntnr-ttl::text, [class*="product-name"]::text').get(default=None))
            href = card.css('a::attr(href)').get()
            price_text = _text(card.css('.prc-box-dscntd::text, .prc-box-sllng::text, [class*="price"]::text').get(default=None))
            rating_text = _text(card.css('.ratings .ratings-count::text, [class*="rating"]::text').get(default=None))
            if not name and not price_text:
                continue
            products.append({
                "name": name,
                "url": urljoin(final_url, href) if href else None,
                "price_text": price_text,
                "rating_text": rating_text,
                "out_of_stock": bool(card.css('.out-of-stock, [class*="OutOfStock"]')),
            })

    # Amazon: seller storefront / search result tiles
    elif platform == "amazon":
        for card in sel.css(
            'div[data-component-type="s-search-result"], '
            'div[data-asin]:not([data-asin=""]), '
            'div.s-result-item'
        )[:120]:
            asin = card.css('::attr(data-asin)').get()
            name = _text(card.css('h2 span::text, h2 a span::text').get(default=None))
            href = card.css('h2 a::attr(href)').get()
            price_text = _text(card.css('.a-price .a-offscreen::text, .a-price-whole::text').get(default=None))
            rating = _text(card.css('span.a-icon-alt::text').get(default=None))
            reviews = _text(card.css('span[aria-label*="rating"] + span ::text, span.a-size-base::text').get(default=None))
            if not name and not asin:
                continue
            products.append({
                "name": name,
                "asin": asin,
                "url": urljoin(final_url, href) if href else None,
                "price_text": price_text,
                "rating_text": rating,
                "reviews_text": reviews,
                "out_of_stock": bool(card.css('span:contains("Currently unavailable"), span:contains("Şu anda mevcut değil")')),
            })

    # Hash for diffing future snapshots
    hash_input = json.dumps(
        [{"name": p.get("name"), "price": p.get("price_text"), "oos": p.get("out_of_stock")} for p in products[:60]],
        sort_keys=True,
    )
    content_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    summary = {
        "platform": platform,
        "product_count": len(products),
        "out_of_stock_count": sum(1 for p in products if p.get("out_of_stock")),
        "page_title": _first(sel, "title::text"),
    }

    return {
        "profile": "marketplace-store",
        "url": url,
        "final_url": final_url,
        "platform": platform,
        "products": products[:80],
        "summary": summary,
        "content_hash": content_hash,
    }


def extract_geo_page(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html, url=url)
    final_url = getattr(response, "url", url) or url
    headers = dict(getattr(response, "headers", {}) or {})
    parsed_url = urlparse(final_url)
    base_domain = parsed_url.netloc
    errors: list[str] = []

    meta_tags: dict[str, str] = {}
    for meta in sel.css("meta"):
        attrs = _attrs(meta)
        name = attrs.get("name") or attrs.get("property") or ""
        content = attrs.get("content") or ""
        if name and content:
            meta_tags[str(name).lower()] = str(content)

    structured_data: list[Any] = []
    for raw in sel.css('script[type="application/ld+json"]::text').getall():
        try:
            structured_data.append(json.loads(str(raw).strip()))
        except (json.JSONDecodeError, TypeError):
            errors.append("Invalid JSON-LD detected")

    heading_structure: list[dict[str, Any]] = []
    h1_tags: list[str] = []
    for level in range(1, 7):
        for text in _css_texts(sel, f"h{level}::text"):
            heading_structure.append({"level": level, "text": text})
            if level == 1:
                h1_tags.append(text)

    raw_html = html or ""
    visible_text = str(sel.get_all_text(separator=" ", strip=True, ignore_tags=("script", "style")))
    text_content = str(
        sel.get_all_text(
            separator=" ",
            strip=True,
            ignore_tags=("script", "style", "nav", "footer", "header"),
        )
    )
    word_count = len(text_content.split())

    og_tags: dict[str, str] = {}
    for meta in sel.css('meta[property^="og:"]'):
        attrs = _attrs(meta)
        if attrs.get("property") and attrs.get("content"):
            og_tags[str(attrs["property"])] = str(attrs["content"])

    twitter_tags: dict[str, str] = {}
    for meta in sel.css('meta[name^="twitter:"]'):
        attrs = _attrs(meta)
        if attrs.get("name") and attrs.get("content"):
            twitter_tags[str(attrs["name"])] = str(attrs["content"])

    hreflang_tags: list[dict[str, str]] = []
    for link in sel.css('link[rel="alternate"]'):
        attrs = _attrs(link)
        if attrs.get("hreflang"):
            hreflang_tags.append({"lang": str(attrs.get("hreflang", "")), "href": str(attrs.get("href", ""))})

    social_profiles: list[dict[str, str]] = []
    social_domains = {
        "facebook": r"(?:facebook\.com|fb\.com)/(?!sharer|share)",
        "twitter": r"(?:twitter\.com|x\.com)/(?!intent|share)",
        "instagram": r"instagram\.com/",
        "linkedin": r"linkedin\.com/(?:company|in)/",
        "youtube": r"youtube\.com/(?:channel|c|@|user)/",
        "tiktok": r"tiktok\.com/@",
        "pinterest": r"pinterest\.com/",
        "github": r"github\.com/(?!login|signup)",
    }
    seen_social: set[str] = set()

    internal_links: list[dict[str, str]] = []
    external_links: list[dict[str, str]] = []
    for link in sel.css("a[href]"):
        attrs = _attrs(link)
        href_raw = str(attrs.get("href", ""))
        href = urljoin(final_url, href_raw)
        link_text = str(link.get_all_text(separator=" ", strip=True))
        parsed_href = urlparse(href)
        if parsed_href.netloc == base_domain:
            internal_links.append({"url": href, "text": link_text})
        elif parsed_href.scheme in ("http", "https"):
            external_links.append({"url": href, "text": link_text})
        for platform, pattern in social_domains.items():
            if platform not in seen_social and re.search(pattern, href, re.I):
                social_profiles.append({"platform": platform, "url": href})
                seen_social.add(platform)

    images: list[dict[str, Any]] = []
    for img in sel.css("img"):
        attrs = _attrs(img)
        images.append(
            {
                "src": str(attrs.get("src", "")),
                "alt": str(attrs.get("alt", "")),
                "width": attrs.get("width"),
                "height": attrs.get("height"),
                "loading": attrs.get("loading"),
            }
        )

    js_files = [str(src) for src in sel.css("script[src]::attr(src)").getall()]
    css_files = [str(href) for href in sel.css('link[rel="stylesheet"]::attr(href)').getall() if str(href)]
    inline_scripts = [str(script) for script in sel.css("script:not([src])::text").getall()]
    inline_styles = [str(style) for style in sel.css("style::text").getall()]

    minification_status: dict[str, bool | None] = {"js_minified": None, "css_minified": None}
    if inline_scripts:
        total_len = sum(len(item) for item in inline_scripts)
        total_lines = sum(item.count("\n") + 1 for item in inline_scripts)
        if total_lines > 0 and total_len > 100:
            minification_status["js_minified"] = (total_len / total_lines) > 200
    if js_files and minification_status["js_minified"] is None:
        minification_status["js_minified"] = sum(1 for item in js_files if ".min." in item) > len(js_files) * 0.5
    if inline_styles:
        total_len = sum(len(item) for item in inline_styles)
        total_lines = sum(item.count("\n") + 1 for item in inline_styles)
        if total_lines > 0 and total_len > 100:
            minification_status["css_minified"] = (total_len / total_lines) > 200
    if css_files and minification_status["css_minified"] is None:
        minification_status["css_minified"] = sum(1 for item in css_files if ".min." in item) > len(css_files) * 0.5

    deprecated_tags = []
    for tag_name in ["font", "center", "marquee", "blink", "big", "strike", "tt", "frame", "frameset", "applet", "basefont", "dir", "isindex", "menu", "s", "u"]:
        count = len(sel.css(tag_name))
        if count:
            deprecated_tags.append({"tag": tag_name, "count": count})

    has_flash = False
    for node in list(sel.css("object")) + list(sel.css("embed")):
        attrs = _attrs(node)
        node_type = str(attrs.get("type", "")).lower()
        src = str(attrs.get("src", ""))
        if "application/x-shockwave-flash" in node_type or "application/x-java-applet" in node_type or src.endswith(".swf"):
            has_flash = True
            break

    iframes = [
        {"src": str(_attrs(iframe).get("src", "")), "title": str(_attrs(iframe).get("title", ""))}
        for iframe in sel.css("iframe")
    ]
    plaintext_emails = sorted(set(re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", visible_text)))

    html_tag = sel.css("html").get(default=None)
    html_attrs = _attrs(sel.css("html").first) if sel.css("html").first else {}
    has_amp = "amp" in html_attrs or "⚡" in html_attrs
    has_amp_link = _first(sel, 'link[rel="amphtml"]::attr(href)')
    if has_amp_link:
        has_amp = True

    favicon_rels = {"icon", "shortcut icon", "apple-touch-icon"}
    has_favicon = False
    for link in sel.css("link[rel]"):
        rel = _attrs(link).get("rel", "")
        rel_text = " ".join(rel) if isinstance(rel, list) else str(rel)
        if any(item in rel_text for item in favicon_rels):
            has_favicon = True
            break

    analytics_patterns = {
        "Google Analytics (gtag.js)": r"gtag\s*\(",
        "Google Analytics (analytics.js)": r"google-analytics\.com/analytics\.js",
        "Google Analytics 4": r"googletagmanager\.com/gtag",
        "Google Tag Manager": r"googletagmanager\.com/gtm\.js",
        "Facebook Pixel": r"fbq\s*\(|connect\.facebook\.net/",
        "Hotjar": r"hotjar\.com",
        "Microsoft Clarity": r"clarity\.ms",
        "Yandex Metrica": r"mc\.yandex\.ru|yandex\.ru/metrika",
        "Matomo/Piwik": r"matomo|piwik",
        "Plausible": r"plausible\.io",
        "Fathom": r"usefathom\.com",
    }
    analytics_tools = [name for name, pattern in analytics_patterns.items() if re.search(pattern, raw_html, re.I)]

    root_checks = []
    for root in sel.css("#app, #root, #__next, #__nuxt"):
        attrs = _attrs(root)
        root_checks.append({"id": attrs.get("id", "unknown"), "text_length": len(str(root.get_all_text(strip=True)))})
    has_ssr_content = True
    for check in root_checks:
        if check["text_length"] < 50 and word_count < 200:
            has_ssr_content = False
            errors.append(
                f"Possible client-side only rendering detected: #{check['id']} has minimal server-rendered content ({word_count} words on page)"
            )

    html_size_bytes = len(raw_html.encode("utf-8"))
    return {
        "url": url,
        "final_url": final_url,
        "is_https": final_url.lower().startswith("https://"),
        "status_code": getattr(response, "status", None),
        "redirect_chain": [
            {"url": getattr(item, "url", ""), "status": getattr(item, "status", None)}
            for item in (getattr(response, "history", None) or [])
        ],
        "headers": headers,
        "meta_tags": meta_tags,
        "title": _first(sel, "title::text"),
        "description": meta_tags.get("description"),
        "canonical": _first(sel, 'link[rel="canonical"]::attr(href)'),
        "h1_tags": h1_tags,
        "heading_structure": heading_structure,
        "word_count": word_count,
        "text_content": text_content,
        "internal_links": internal_links,
        "external_links": external_links,
        "images": images,
        "structured_data": structured_data,
        "has_ssr_content": has_ssr_content,
        "security_headers": {header: _header_value(headers, header) for header in SECURITY_HEADERS},
        "analytics_tools": analytics_tools,
        "social_profiles": social_profiles,
        "has_favicon": has_favicon,
        "inline_styles_count": len(sel.css("[style]")),
        "deprecated_tags": deprecated_tags,
        "has_flash": has_flash,
        "iframes": iframes,
        "plaintext_emails": plaintext_emails,
        "is_http2": None,
        "has_amp": has_amp,
        "has_amp_link": has_amp_link,
        "resource_breakdown": {"js": len(js_files), "css": len(css_files), "img": len(images), "other": 0},
        "js_files": js_files,
        "css_files": css_files,
        "minification_status": minification_status,
        "has_hreflang": bool(hreflang_tags),
        "hreflang_tags": hreflang_tags,
        "lang_attribute": html_attrs.get("lang"),
        "og_tags": og_tags,
        "twitter_tags": twitter_tags,
        "text_to_html_ratio": round((len(text_content) / (len(raw_html) or 1)) * 100, 1),
        "html_size_bytes": html_size_bytes,
        "errors": errors,
    }


def extract_geo_robots(robots_text: str, robots_url: str, status_code: int | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "url": robots_url,
        "exists": status_code == 200,
        "content": robots_text if status_code == 200 else "",
        "ai_crawler_status": {},
        "sitemaps": [],
        "errors": [],
    }

    if status_code == 404:
        result["errors"].append("No robots.txt found (404)")
        for crawler in AI_CRAWLERS:
            result["ai_crawler_status"][crawler] = "NO_ROBOTS_TXT"
        return result
    if status_code != 200:
        result["errors"].append(f"Unexpected status code: {status_code}")
        return result

    current_agent: str | None = None
    agent_rules: dict[str, list[dict[str, str]]] = {}
    for line in robots_text.split("\n"):
        line = line.strip()
        if line.lower().startswith("user-agent:"):
            current_agent = line.split(":", 1)[1].strip()
            agent_rules.setdefault(current_agent, [])
        elif line.lower().startswith("disallow:") and current_agent:
            agent_rules[current_agent].append({"directive": "Disallow", "path": line.split(":", 1)[1].strip()})
        elif line.lower().startswith("allow:") and current_agent:
            agent_rules[current_agent].append({"directive": "Allow", "path": line.split(":", 1)[1].strip()})
        elif line.lower().startswith("sitemap:"):
            sitemap_url = line.split(":", 1)[1].strip()
            if not sitemap_url.startswith("http"):
                sitemap_url = "http" + sitemap_url
            result["sitemaps"].append(sitemap_url)

    for crawler in AI_CRAWLERS:
        if crawler in agent_rules:
            rules = agent_rules[crawler]
            if any(rule["directive"] == "Disallow" and rule["path"] == "/" for rule in rules):
                result["ai_crawler_status"][crawler] = "BLOCKED"
            elif any(rule["directive"] == "Disallow" and rule["path"] for rule in rules):
                result["ai_crawler_status"][crawler] = "PARTIALLY_BLOCKED"
            else:
                result["ai_crawler_status"][crawler] = "ALLOWED"
        elif "*" in agent_rules:
            wildcard_rules = agent_rules["*"]
            if any(rule["directive"] == "Disallow" and rule["path"] == "/" for rule in wildcard_rules):
                result["ai_crawler_status"][crawler] = "BLOCKED_BY_WILDCARD"
            else:
                result["ai_crawler_status"][crawler] = "ALLOWED_BY_DEFAULT"
        else:
            result["ai_crawler_status"][crawler] = "NOT_MENTIONED"

    return result
