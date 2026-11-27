import asyncio
import os
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_suivi_projets")
os.environ.setdefault("APP_PASSWORD", "test-cabinet-password")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-at-least-32-characters")

import server


def test_login_returns_token_and_rejects_wrong_password(monkeypatch):
    monkeypatch.setenv("APP_PASSWORD", "test-cabinet-password")
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters")

    result = asyncio.run(server.login(server.SharedLogin(password="test-cabinet-password")))
    principal = asyncio.run(server.require_shared_session(f"Bearer {result['token']}"))

    assert principal == "shared-cabinet"
    with pytest.raises(HTTPException) as error:
        asyncio.run(server.login(server.SharedLogin(password="incorrect")))
    assert error.value.status_code == 401


def test_shared_data_load_and_save(monkeypatch):
    class Collection:
        saved = None

        async def find_one(self, query):
            return self.saved

        async def replace_one(self, query, document, upsert):
            self.saved = document

    collection = Collection()
    monkeypatch.setattr(server, "db", SimpleNamespace(app_data=collection))

    empty = asyncio.run(server.get_shared_data("shared-cabinet"))
    assert empty == {"exists": False, "projects": [], "settings": {}}

    payload = server.SharedAppData(projects=[{"id": "p1"}], settings={"owner": "Cabinet"})
    asyncio.run(server.save_shared_data(payload, "shared-cabinet"))
    saved = asyncio.run(server.get_shared_data("shared-cabinet"))

    assert saved == {
        "exists": True,
        "projects": [{"id": "p1"}],
        "settings": {"owner": "Cabinet"},
    }
