import pytest
from fastapi import HTTPException

from src.auth import require_api_key
from src.config import get_settings


class FakeRedis:
    def __init__(self, record=None):
        self.record = record or {}

    async def hgetall(self, key: str):
        return self.record


@pytest.mark.asyncio
async def test_require_api_key_accepts_env_key(monkeypatch):
    monkeypatch.setenv("API_KEYS", "scraper-geoserra-test")
    get_settings.cache_clear()

    principal = await require_api_key("Bearer scraper-geoserra-test", get_settings(), FakeRedis())

    assert principal.project == "geoserra"
    assert principal.tenant_key == "geoserra"
    assert principal.quota_key == "geoserra"


@pytest.mark.asyncio
async def test_require_api_key_prefers_redis_tenant_key(monkeypatch):
    monkeypatch.setenv("API_KEYS", "")
    get_settings.cache_clear()

    principal = await require_api_key(
        "Bearer scraper-any-key",
        get_settings(),
        FakeRedis({"project": "legacy-project", "tenant_key": "vistaseeds", "plan": "agency"}),
    )

    assert principal.project == "legacy-project"
    assert principal.tenant_key == "vistaseeds"
    assert principal.plan == "agency"
    assert principal.quota_key == "vistaseeds"


@pytest.mark.asyncio
async def test_require_api_key_rejects_missing_header(monkeypatch):
    monkeypatch.setenv("API_KEYS", "scraper-geoserra-test")
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        await require_api_key(None, get_settings(), FakeRedis())

    assert exc.value.status_code == 401
