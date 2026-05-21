from src.engine.extractors import (
    extract_directory_listing,
    extract_fair_exhibitor,
    extract_fair_exhibitor_detail,
    extract_website_analysis,
)


class FakeResponse:
    url = "https://example.com/list"
    status = 200
    headers = {}


def test_website_analysis_extracts_b2b_contact_signals():
    html = """
    <html><head><title>Acme Auto</title><meta name="description" content="Wholesale car mats"></head>
    <body><h1>Acme Auto</h1><p>We are a wholesale distributor for automotive floor mats and private label products.</p>
    <a href="mailto:sales@example.com">sales@example.com</a><a href="https://linkedin.com/company/acme">LinkedIn</a></body></html>
    """
    data = extract_website_analysis(html, "https://example.com", FakeResponse())

    assert data["company_name"] == "Acme Auto"
    assert data["is_likely_b2b"] is True
    assert data["sells_automotive_accessories"] is True
    assert data["contact"]["emails"] == ["sales@example.com"]


def test_directory_listing_extracts_company_cards():
    html = """
    <article class="company"><h2>North Auto GmbH</h2><p>Importer of car accessories</p><a href="/north">Website</a></article>
    <article class="company"><h2>West Mats BV</h2><p>Wholesale floor mats +31 20 123 4567</p></article>
    """
    data = extract_directory_listing(html, "https://directory.test/search", FakeResponse())

    assert data["count"] == 2
    assert data["companies"][0]["name"] == "North Auto GmbH"
    assert data["companies"][0]["website"] == "https://example.com/north"


def test_fair_exhibitor_extracts_booth_hint():
    html = """
    <div class="exhibitor"><h3>Expo Mats Ltd</h3><p>Hall 4 Stand A12 automotive accessories</p></div>
    """
    data = extract_fair_exhibitor(html, "https://fair.test/exhibitors", FakeResponse())

    assert data["count"] == 1
    assert data["exhibitors"][0]["name"] == "Expo Mats Ltd"
    assert data["exhibitors"][0]["booth_number"] == "A12"


def test_messefrankfurt_fair_exhibitor_extracts_detail_links():
    html = """
    <div class="search-result">
      <a href="/frankfurt/en/exhibitor-search.detail.html/acme-auto-gmbh.html">Acme Auto GmbH</a>
      <p>Hall 3.1 Stand D11 Automotive accessories</p>
    </div>
    """
    response = FakeResponse()
    response.url = "https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html"

    data = extract_fair_exhibitor(html, response.url, response)

    assert data["count"] == 1
    assert data["exhibitors"][0]["name"] == "Acme Auto GmbH"
    assert data["exhibitors"][0]["detail_url"].endswith("/acme-auto-gmbh.html")
    assert data["exhibitors"][0]["booth_number"] == "3.1 D11"


def test_fair_exhibitor_detail_extracts_json_ld_and_labels():
    html = """
    <html><head>
      <script type="application/ld+json">
      {"@type":"Organization","name":"Acme Auto GmbH","url":"https://acme.example",
       "telephone":"+49 69 123","email":"sales@acme.example",
       "address":{"streetAddress":"Mainzer Str. 1","postalCode":"60311","addressLocality":"Frankfurt","addressCountry":"DE"},
       "description":"Distributor of floor mats and interior accessories"}
      </script>
    </head>
    <body>
      <h1>Acme Auto GmbH</h1>
      <p>Hall 3.1 Stand D11</p>
      <p>Product groups: floor mats, boot liners</p>
      <p>Brands: Acme, RoadPro</p>
      <p>Trade audience: distributors, wholesalers</p>
    </body></html>
    """
    data = extract_fair_exhibitor_detail(html, "https://fair.test/detail/acme", FakeResponse())

    assert data["name"] == "Acme Auto GmbH"
    assert data["website"] == "https://acme.example"
    assert data["booth"] == "3.1 D11"
    assert data["hall"] == "3.1"
    assert data["country"] == "DE"
    assert data["city"] == "Frankfurt"
    assert data["product_groups"] == ["floor mats", "boot liners"]
    assert data["trade_audience"] == ["distributors", "wholesalers"]
