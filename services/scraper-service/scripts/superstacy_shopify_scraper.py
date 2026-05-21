#!/usr/bin/env python3
"""Fetch Superstacy Shopify catalog through the scraper-service API."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
from typing import Any
from urllib import parse, request
from urllib.error import HTTPError, URLError


SITE_URL = "https://www.superstacy.com.tr"
DEFAULT_PER_PAGE = 250
DEFAULT_OUTPUT = "superstacy_products.json"
STORE_INFO = {
    "name": "Superstacy",
    "slug": "superstacy",
    "url": SITE_URL,
    "email": "info@superstacy.com.tr",
}
EXCLUDED_HANDLES = {"ucretsiz-kargo"}
EXCLUDED_TITLE_PATTERNS = (
    re.compile(r"\bücretsiz\s+kargo\b", re.I),
)


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", value, flags=re.I)
    text = re.sub(r"</\s*(p|div|li|h[1-6])\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    return text.strip()


def to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def category_for(product: dict[str, Any]) -> str:
    product_type = (product.get("product_type") or "").strip()
    if product_type:
        return product_type

    title = (product.get("title") or "").casefold()
    rules = [
        ("tayt", "Kadın Tayt"),
        ("legging", "Kadın Tayt"),
        ("büstiyer", "Spor Büstiyer"),
        ("bustier", "Spor Büstiyer"),
        ("bra", "Spor Büstiyer"),
        ("top", "Üst Giyim"),
        ("crop", "Üst Giyim"),
        ("tişört", "Üst Giyim"),
        ("t-shirt", "Üst Giyim"),
        ("şort", "Şort"),
        ("short", "Şort"),
        ("pantolon", "Pantolon"),
        ("jogger", "Eşofman"),
        ("eşofman", "Eşofman"),
        ("ceket", "Dış Giyim"),
        ("sweat", "Sweatshirt"),
    ]
    for needle, category in rules:
        if needle in title:
            return category
    return "Kadın Giyim"


def parent_category_for(category: str) -> str:
    if category in {"Kadın Tayt", "Pantolon", "Şort", "Eşofman"}:
        return "Alt Giyim"
    if category in {"Spor Büstiyer", "Üst Giyim", "Sweatshirt"}:
        return "Üst Giyim"
    if category == "Dış Giyim":
        return "Dış Giyim"
    return "Giyim"


def has_product_image(product: dict[str, Any]) -> bool:
    if (product.get("image") or {}).get("src"):
        return True
    return any(image.get("src") for image in product.get("images", []))


def should_skip_product(product: dict[str, Any]) -> bool:
    handle = str(product.get("handle") or "").strip().casefold()
    title = str(product.get("title") or "").strip()
    if handle in EXCLUDED_HANDLES:
        return True
    if any(pattern.search(title) for pattern in EXCLUDED_TITLE_PATTERNS):
        return True
    return not has_product_image(product)


def scraper_config() -> tuple[str, str, int]:
    base_url = os.environ.get("SCRAPER_URL", "").rstrip("/")
    api_key = os.environ.get("SCRAPER_API_KEY", "")
    timeout = int(os.environ.get("SCRAPER_TIMEOUT", "60"))
    if not base_url or not api_key:
        raise SystemExit("SCRAPER_URL ve SCRAPER_API_KEY ortam değişkenleri gerekli.")
    return base_url, api_key, timeout


def scrape_json(url: str, mode: str) -> dict[str, Any]:
    base_url, api_key, timeout = scraper_config()
    payload = {
        "url": url,
        "mode": mode,
        "return_html": True,
        "options": {"timeout": timeout},
    }
    req = request.Request(
        f"{base_url}/api/v1/scrape",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=timeout + 10) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Scraper API HTTP {exc.code}: {detail[:300]}") from exc
    except URLError as exc:
        raise RuntimeError(f"Scraper API bağlantı hatası: {exc}") from exc

    if not data.get("success"):
        raise RuntimeError(f"Scraper başarısız: {data.get('error') or data}")

    body = data.get("html") or data.get("text") or ""
    if not body:
        raise RuntimeError(f"Scraper boş içerik döndürdü: {url}")

    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        preview = body[:300].replace("\n", " ")
        raise RuntimeError(f"JSON parse edilemedi: {preview}") from exc


def product_endpoint(page: int, per_page: int) -> str:
    query = parse.urlencode({"limit": per_page, "page": page})
    return f"{SITE_URL}/products.json?{query}"


def fetch_products(limit: int, mode: str, sleep: float) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    page = 1

    while True:
        remaining = limit - len(products) if limit else DEFAULT_PER_PAGE
        per_page = min(DEFAULT_PER_PAGE, remaining if remaining > 0 else DEFAULT_PER_PAGE)
        data = scrape_json(product_endpoint(page, per_page), mode)
        batch = data.get("products") or []
        if not batch:
            break

        for product in batch:
            source_id = str(product.get("id") or product.get("handle") or "")
            if not source_id or source_id in seen_ids:
                continue
            if should_skip_product(product):
                seen_ids.add(source_id)
                continue
            seen_ids.add(source_id)
            products.append(product)
            if limit and len(products) >= limit:
                return products

        if len(batch) < per_page:
            break
        page += 1
        if sleep:
            time.sleep(sleep)

    return products


def normalize_variant(product: dict[str, Any], variant: dict[str, Any]) -> dict[str, Any]:
    price = to_float(variant.get("price"))
    compare_price = to_float(variant.get("compare_at_price"))
    featured_image = variant.get("featured_image") or {}
    return {
        "source_variant_id": str(variant.get("id") or ""),
        "sku": variant.get("sku") or "",
        "title": variant.get("title") or "",
        "barcode": variant.get("barcode") or "",
        "price": price,
        "compare_at_price": compare_price,
        "available": bool(variant.get("available")),
        "stock_quantity": 1 if variant.get("available") else 0,
        "option1": variant.get("option1"),
        "option2": variant.get("option2"),
        "option3": variant.get("option3"),
        "image_id": str(featured_image.get("id") or ""),
        "product_id": str(product.get("id") or ""),
    }


def normalize_product(product: dict[str, Any]) -> dict[str, Any]:
    variants = [normalize_variant(product, variant) for variant in product.get("variants", [])]
    image_urls = [
        image.get("src")
        for image in product.get("images", [])
        if image.get("src")
    ]
    prices = [variant["price"] for variant in variants if variant["price"] is not None]
    compare_prices = [
        variant["compare_at_price"]
        for variant in variants
        if variant["compare_at_price"] is not None
    ]
    base_price = min(prices) if prices else None
    compare_price = max(compare_prices) if compare_prices else None
    discounted_price = base_price if compare_price and base_price and compare_price > base_price else None
    category = category_for(product)
    tags = product.get("tags") or []
    description_html = product.get("body_html") or ""
    slug = product.get("handle") or str(product.get("id") or "")

    return {
        "source": "superstacy",
        "store": STORE_INFO,
        "store_name": STORE_INFO["name"],
        "store_slug": STORE_INFO["slug"],
        "store_url": STORE_INFO["url"],
        "source_product_id": str(product.get("id") or ""),
        "name": product.get("title") or "",
        "slug": slug,
        "url": f"{SITE_URL}/products/{slug}",
        "brand": product.get("vendor") or "SUPERSTACY",
        "category": category,
        "parent_category": parent_category_for(category),
        "categories": [category],
        "tags": tags,
        "description_html": description_html,
        "description_text": strip_html(description_html),
        "currency": "TRY",
        "original_price": compare_price or base_price,
        "discounted_price": discounted_price,
        "available": any(variant["available"] for variant in variants),
        "stock_quantity": sum(variant["stock_quantity"] for variant in variants),
        "sku": next((variant["sku"] for variant in variants if variant["sku"]), ""),
        "thumbnail_url": product.get("image", {}).get("src") or (image_urls[0] if image_urls else ""),
        "all_image_urls": image_urls,
        "variants": variants,
        "options": product.get("options") or [],
        "raw_shopify_id": product.get("id"),
        "published_at": product.get("published_at"),
        "created_at": product.get("created_at"),
        "updated_at": product.get("updated_at"),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Superstacy Shopify scraper-service client")
    parser.add_argument("--limit", type=int, default=0, help="0 tüm katalog, pozitif değer test limiti")
    parser.add_argument("--out", default=DEFAULT_OUTPUT, help="JSON çıktı dosyası")
    parser.add_argument("--mode", choices=["fast", "stealthy", "dynamic"], default="fast")
    parser.add_argument("--sleep", type=float, default=0.15, help="Sayfalar arası bekleme süresi")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    raw_products = fetch_products(args.limit, args.mode, args.sleep)
    products = [normalize_product(product) for product in raw_products]
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(products, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"superstacy_products={len(products)} out={args.out}")
    if products:
        first = products[0]
        print(
            "sample="
            + json.dumps(
                {
                    "name": first["name"],
                    "slug": first["slug"],
                    "price": first["original_price"],
                    "variants": len(first["variants"]),
                    "images": len(first["all_image_urls"]),
                },
                ensure_ascii=False,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
