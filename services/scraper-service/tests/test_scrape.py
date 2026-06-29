from src.engine.selectors import extract_selectors
from src.lib.cache import build_cache_key
from src.schemas.scrape import ScrapeRequest
from src.config import get_settings
from src.engine.fetcher import _fast_kwargs, _proxy_url_for_request


class FakeSelection:
    def __init__(self, values):
        self.values = values

    def getall(self):
        return self.values


class FakePage:
    def css(self, selector):
        if selector == "title::text":
            return FakeSelection(["Example"])
        return FakeSelection([])


def test_cache_key_ignores_return_flags():
    one = ScrapeRequest(url="https://example.com", return_html=True)
    two = ScrapeRequest(url="https://example.com", return_text=True)

    assert build_cache_key(one) == build_cache_key(two)


def test_extract_selectors_single_value_is_scalar():
    data = extract_selectors(FakePage(), {"title": "title::text"})

    assert data["title"] == "Example"


def test_fair_proxy_url_is_applied_only_to_fair_profiles(monkeypatch):
    monkeypatch.setenv("FAIR_PROXY_URL", "http://proxy.example:8080")
    get_settings.cache_clear()
    try:
        fair = ScrapeRequest(url="https://fair.example", profile="fair-exhibitor")
        lead = ScrapeRequest(url="https://lead.example", profile="website-analysis")

        assert _proxy_url_for_request(fair) == "http://proxy.example:8080"
        assert _fast_kwargs(fair)["proxy"] == "http://proxy.example:8080"
        assert _proxy_url_for_request(lead) is None
        assert "proxy" not in _fast_kwargs(lead)
    finally:
        get_settings.cache_clear()


def test_fair_proxy_url_is_optional(monkeypatch):
    monkeypatch.delenv("FAIR_PROXY_URL", raising=False)
    get_settings.cache_clear()
    try:
        request = ScrapeRequest(url="https://fair.example", profile="fair-exhibitor-detail")

        assert _proxy_url_for_request(request) is None
        assert "proxy" not in _fast_kwargs(request)
    finally:
        get_settings.cache_clear()
