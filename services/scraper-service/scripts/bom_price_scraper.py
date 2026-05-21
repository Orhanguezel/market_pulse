"""BOM Temin Listesi — Gerçek fiyat scraper.

Strateji (öncelik sırası):
  1. JSON-LD structured_data → @type:Product → offers.price  (en güvenilir)
  2. CSS selector → data["price"]
  3. Sayfa metni regex

Kullanım:
    cd /home/orhan/Documents/Projeler/scraper-service
    REDIS_URL=memory:// API_KEYS=local-dev-key .venv/bin/python scripts/bom_price_scraper.py
"""

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx

API_BASE = "http://localhost:8200"
API_KEY = "local-dev-key"

HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}


@dataclass
class BomItem:
    id: str
    name: str
    url: str
    seller: str
    estimated_tl: str
    mode: str = "stealthy"
    selectors: dict = field(default_factory=dict)
    price_selector: str = ".price, [class*='price'], [itemprop='price'], .product-price, bdi"
    wait_for: str | None = None
    solve_cloudflare: bool = True


BOM_ITEMS = [
    BomItem(
        id="1",
        name="NVIDIA Jetson Orin Nano Super 8GB Developer Kit",
        url="https://openzeka.com/urun/nvidia-jetson-orin-nano-developer-kit/",
        seller="OpenZeka",
        estimated_tl="~20.000",
        mode="stealthy",
        price_selector=".woocommerce-Price-amount, .price, bdi, [class*='price']",
        selectors={
            "title": "h1.product_title, h1",
            "stock": ".stock, .availability",
        },
    ),
    BomItem(
        id="1b",
        name="NVIDIA Jetson Orin Nano Super (Alt: SAMM)",
        url="https://market.samm.com/nvidia-jetson-orin-nano-super-developer-kit",
        seller="SAMM Market",
        estimated_tl="~20.832",
        mode="stealthy",
        price_selector="[class*='price'], .product-price",
        selectors={"title": "h1", "stock": ".stock, [class*='stock']"},
    ),
    BomItem(
        id="2",
        name="Orbbec Gemini 335 RGB-D kamera",
        url="https://www.e-komponent.com/orbbec-gemini-335-depth-camera-100100476",
        seller="e-komponent",
        estimated_tl="~21.333",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, .product-price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock, .availability, [class*='stock']"},
    ),
    BomItem(
        id="2b",
        name="Orbbec Gemini 335 (Alt: Robot Sepeti)",
        url="https://www.robotsepeti.com/orbbec-gemini-335-3d-stereo-derinlik-kamerasi",
        seller="Robot Sepeti",
        estimated_tl="~28.246",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock, .availability"},
    ),
    BomItem(
        id="3",
        name="AAXA P400 mini projektör",
        url="https://www.teknosa.com/aaxa-p400-1080p-kisa-mesafeli-mini-projektor-2-saat-pil-omru-p-780940335",
        seller="Teknosa",
        estimated_tl="~32.525",
        mode="stealthy",
        price_selector="[class*='price']:not(:empty), [data-testid*='price']",
        selectors={"title": "h1", "stock": "[class*='stock'], [class*='available']"},
        # Teknosa fiyatı network_idle sonrasında lazy API çağrısıyla yüklenir — wait_for şart
        wait_for="[data-testid*='price'], [class*='PriceBox'], [class*='price']:not(:empty)",
    ),
    BomItem(
        id="5",
        name="512 GB NVMe SSD (M.2 2280) — kategori sayfası",
        url="https://www.vatanbilgisayar.com/nvme-m-2/",
        seller="Vatanbilgisayar",
        estimated_tl="~1.500",
        mode="stealthy",
        price_selector=".product-price, [class*='price']",
        selectors={"products": ".product-name, .product-title"},
    ),
    BomItem(
        id="6",
        name="40×40 sigma profil (birim fiyat, metre)",
        url="https://www.cnc-marketi.com/urun/sigma-profil-40x40-sigma-profil-8-kanal",
        seller="CNC Marketi",
        estimated_tl="~680 (160cm)",
        mode="fast",
        price_selector=".woocommerce-Price-amount, .price, bdi, [class*='price']",
        selectors={"title": "h1", "stock": ".stock"},
    ),
    BomItem(
        id="7",
        name="20×20 V-Slot profil (birim fiyat, metre)",
        url="https://www.cnc-marketi.com/urun/20x20-v-slot-sigma-profil-6-kanal",
        seller="CNC Marketi",
        estimated_tl="~128 (60cm)",
        mode="fast",
        price_selector=".woocommerce-Price-amount, .price, bdi, [class*='price']",
        selectors={"title": "h1", "stock": ".stock"},
    ),
    BomItem(
        id="8",
        name="Mini V wheel kaydırıcı kiti (POM Pulley)",
        url="https://www.robotistan.com/pom-pulley-3d-printer-wheels",
        seller="Robotistan",
        estimated_tl="~300",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock, .availability"},
    ),
    BomItem(
        id="9",
        name="Eksantrik somun (5×8.5mm) + kilit kolu",
        url="https://www.robolinkmarket.com/eksantrik-somun-5x85mm-v-kanalli",
        seller="Robolink Market",
        estimated_tl="~200",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock"},
    ),
    BomItem(
        id="10",
        name="Altınkaya IP65 alüminyum kutu 200×160×100mm",
        # ⚠️ Kategori sayfası → USD fiyatlar parse edilmişti. Spesifik ürün URL'si gerekiyor.
        # Altınkaya için telefon ile teyit önerilir: +90 312 963 1985
        # Aşağıdaki URL örnek — doğrulayın veya uygun modeli altinkaya.com'dan seçin.
        url="https://www.altinkaya.com/tr/shop/category/ip65-aluminyum-kutular-130",
        seller="Altınkaya",
        estimated_tl="~700-900",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, [class*='price']",
        selectors={"products": ".product-name, h3, [class*='product-title']"},
    ),
    BomItem(
        id="11",
        name="Antireflekte PVC optik pencere 70×100 cm",
        url="https://www.malzemeshop.com.tr/urun/0-50-mm-seffaf-antireflekte-pvc-levha-70x100-cm",
        seller="MalzemeShop",
        estimated_tl="~300",
        mode="fast",
        price_selector="[itemprop='price'], .price, .product-price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock"},
    ),
    BomItem(
        id="13",
        name="DC buck converter / voltaj regülatör (LM2596)",
        # ⚠️ Önceki URL kategori sayfasıydı → çok ürünün toplamı parse edildi.
        # Spesifik ürün URL'si doğrulanmalı: robotistan.com üzerinden LM2596 arayın.
        url="https://www.robotistan.com/lm2596-dc-dc-buck-voltaj-dusurucu-karti",
        seller="Robotistan",
        estimated_tl="~100",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock, .availability"},
    ),
    BomItem(
        id="14",
        name="19V 7.9A 150W DC adaptör (laptop tipi)",
        url="https://www.aykom.com.tr/urun/retro-acer-aspire-19v-7-9a-150w-notebook-adaptor-rna-ac04",
        seller="Aykom",
        estimated_tl="~600",
        mode="stealthy",
        price_selector="[itemprop='price'], .price, .product-price, [class*='price']",
        selectors={"title": "h1", "stock": ".stock"},
    ),
    BomItem(
        id="15",
        name="Tekerlekli platform / servis arabası 60×80cm",
        url="https://www.trendyol.com/acar-raf/profil-ayakli-sepet-cift-katli-tel-sepet-60x80-cm-p-333326581",
        seller="Trendyol",
        estimated_tl="~1.500",
        mode="stealthy",
        price_selector="[class*='price'], [data-testid*='price']",
        selectors={"title": "h1", "stock": "[class*='stock'], [class*='available']"},
    ),
]


def _extract_price_from_structured_data(structured_data: list[dict]) -> Optional[str]:
    """JSON-LD Product schema'dan fiyat çıkarır."""
    for item in structured_data:
        if not isinstance(item, dict):
            continue
        # @type: Product
        if item.get("@type") == "Product":
            offers = item.get("offers") or item.get("Offers")
            if isinstance(offers, dict):
                price = offers.get("price")
                currency = offers.get("priceCurrency", "TRY")
                availability = offers.get("availability", "")
                avail_short = availability.split("/")[-1] if availability else ""
                if price:
                    return f"{price} {currency}  [{avail_short}]"
            elif isinstance(offers, list):
                for offer in offers:
                    price = offer.get("price")
                    currency = offer.get("priceCurrency", "TRY")
                    if price:
                        return f"{price} {currency}"
    return None


def _extract_price_from_text(text: str) -> Optional[str]:
    """Sayfa metninden TL fiyatı regex ile çeker. USD fiyatları atlar."""
    # USD bağlamını atlamak için önce USD işaretleri çıkar
    text_no_usd = re.sub(r'\$[\d,\.]+|\bUSD\b[\d,\. ]+|\bEUR\b[\d,\. ]+', '', text)
    patterns = [
        r"(\d[\d\.]+,\d{2})\s*(?:TL|₺)",
        r"₺\s*(\d[\d\.,]+)",
        # JSON price alanı — sadece priceCurrency TRY ise güvenilir; yoksa atla
        r'"priceCurrency"\s*:\s*"TRY"[^}]*"price"\s*:\s*"([\d\.]+)"',
        r'"price"\s*:\s*"([\d\.]+)"[^}]*"priceCurrency"\s*:\s*"TRY"',
        r'content="([\d\.]+)"[^>]*itemprop="price"',
        r'itemprop="price"[^>]*content="([\d\.]+)"',
    ]
    for pattern in patterns:
        m = re.search(pattern, text_no_usd, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def _first_str(val: Any) -> str:
    """Liste veya string'den ilk anlamlı metni döner."""
    if isinstance(val, list):
        for v in val:
            s = re.sub(r"<[^>]+>", "", str(v)).strip()
            if s:
                return s
        return ""
    return re.sub(r"<[^>]+>", "", str(val)).strip()


async def scrape_item(client: httpx.AsyncClient, item: BomItem) -> dict:
    print(f"  [{item.id}] {item.seller} — {item.name[:55]}...")

    # Tüm selector'ları birleştir
    all_selectors = {"price": item.price_selector, **item.selectors}

    options: dict = {
        "timeout": 45,
        "headless": True,
        "network_idle": True,
        "block_ads": True,
        "solve_cloudflare": item.solve_cloudflare,
    }
    if item.wait_for:
        options["wait_for"] = item.wait_for

    payload = {
        "url": item.url,
        "mode": item.mode,
        "return_text": True,
        "selectors": all_selectors,
        "options": options,
    }

    result = {
        "id": item.id,
        "name": item.name,
        "seller": item.seller,
        "url": item.url,
        "estimated_tl": item.estimated_tl,
        "real_price": None,
        "stock": None,
        "title": None,
        "source": None,
        "error": None,
    }

    try:
        resp = await client.post(
            f"{API_BASE}/api/v1/scrape",
            json=payload,
            headers=HEADERS,
            timeout=70,
        )
        api_data = resp.json()

        if not api_data.get("success"):
            result["error"] = api_data.get("error", f"HTTP {resp.status_code}")
            return result

        data = api_data.get("data", {})
        page_text = api_data.get("text", "") or ""

        # 1. JSON-LD structured_data
        structured = data.get("structured_data", [])
        if structured:
            sd_price = _extract_price_from_structured_data(structured)
            if sd_price:
                result["real_price"] = sd_price
                result["source"] = "JSON-LD"

        # 2. CSS selector → data["price"]
        if not result["real_price"]:
            price_sel = data.get("price")
            if price_sel:
                raw = _first_str(price_sel)
                if raw:
                    result["real_price"] = raw[:150]
                    result["source"] = "CSS selector"

        # 3. Sayfa metni regex
        if not result["real_price"] and page_text:
            txt_price = _extract_price_from_text(page_text)
            if txt_price:
                result["real_price"] = f"{txt_price} TL"
                result["source"] = "text-regex"

        # Başlık
        title_val = data.get("title") or data.get("h1_tags")
        if title_val:
            result["title"] = _first_str(title_val)[:100]

        # Stok
        stock_val = data.get("stock")
        if stock_val:
            result["stock"] = _first_str(stock_val)[:80]

        if api_data.get("status_code") and api_data["status_code"] != 200:
            result["error"] = f"HTTP {api_data['status_code']}"

    except httpx.TimeoutException:
        result["error"] = "timeout (70s)"
    except Exception as e:
        result["error"] = str(e)[:120]

    return result


def _format_results(results: list[dict]) -> str:
    lines = []
    sep = "=" * 80
    lines.append(f"\n{sep}")
    lines.append("BOM TEMİN LİSTESİ — GERÇEK FİYAT SONUÇLARI")
    lines.append("Tarih: 2026-05-08  |  Kaynak: Türkiye e-ticaret siteleri")
    lines.append(sep)

    success_count = 0
    for r in results:
        lines.append(f"\n[{r['id']}] {r['name']}")
        lines.append(f"     Satıcı   : {r['seller']}")
        lines.append(f"     Tahmini  : {r['estimated_tl']} TL")
        if r["error"]:
            lines.append(f"     ❌ Hata   : {r['error']}")
        elif r["real_price"]:
            src = f"  ({r['source']})" if r["source"] else ""
            lines.append(f"     ✅ Gerçek : {r['real_price']}{src}")
            success_count += 1
        else:
            lines.append("     ⚠️  Fiyat bulunamadı")
        if r["stock"]:
            lines.append(f"     Stok     : {r['stock']}")
        if r["title"]:
            lines.append(f"     Sayfa    : {r['title']}")

    lines.append(f"\n{sep}")
    lines.append(f"ÖZET: {success_count}/{len(results)} üründe gerçek fiyat alındı")
    lines.append(sep)
    return "\n".join(lines)


async def main():
    print("BOM fiyat scraper başlıyor...")
    print(f"API: {API_BASE}  |  Ürün sayısı: {len(BOM_ITEMS)}\n")

    all_results: list[dict] = []

    async with httpx.AsyncClient() as client:
        # 3'er paralel, araya 2s bekleme
        chunk_size = 3
        for i in range(0, len(BOM_ITEMS), chunk_size):
            chunk = BOM_ITEMS[i : i + chunk_size]
            tasks = [scrape_item(client, item) for item in chunk]
            chunk_results = await asyncio.gather(*tasks, return_exceptions=False)
            all_results.extend(chunk_results)
            if i + chunk_size < len(BOM_ITEMS):
                await asyncio.sleep(2)

    print(_format_results(all_results))

    out_path = "docs/bom-prices-2026-05-08.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\nJSON kaydedildi: {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
