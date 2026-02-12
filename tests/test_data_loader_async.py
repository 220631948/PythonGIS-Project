import asyncio

import pytest

pytest.importorskip("geopandas")

from app.core.data_loader import DataLoader


def test_get_gdf_async_delegates_to_threadpool(monkeypatch):
    loader = DataLoader()
    called = {}
    expected_gdf = object()

    def fake_get_gdf(dataset_name: str, force_refresh: bool = False):
        called["get_gdf"] = (dataset_name, force_refresh)
        return expected_gdf

    async def fake_threadpool(func, *args, **kwargs):
        await asyncio.sleep(0)
        called["threadpool"] = (func, args, kwargs)
        return func(*args, **kwargs)

    monkeypatch.setattr(loader, "get_gdf", fake_get_gdf)
    monkeypatch.setattr("app.core.data_loader.run_in_threadpool", fake_threadpool)

    result = asyncio.run(loader.get_gdf_async("suburbs", True))

    assert result is expected_gdf
    assert called["get_gdf"] == ("suburbs", True)
    assert called["threadpool"][1] == ("suburbs", True)


def test_get_paginated_gdf_async_delegates_to_threadpool(monkeypatch):
    loader = DataLoader()
    called = {}
    expected_page = object()

    def fake_get_paginated(dataset_name: str, limit: int, offset: int, force_refresh: bool):
        called["get_paginated"] = (dataset_name, limit, offset, force_refresh)
        return expected_page, 123

    async def fake_threadpool(func, *args, **kwargs):
        await asyncio.sleep(0)
        called["threadpool"] = (func, args, kwargs)
        return func(*args, **kwargs)

    monkeypatch.setattr(loader, "get_paginated_gdf", fake_get_paginated)
    monkeypatch.setattr("app.core.data_loader.run_in_threadpool", fake_threadpool)

    result = asyncio.run(loader.get_paginated_gdf_async("suburbs", 250, 50, True))

    assert result[0] is expected_page
    assert result[1] == 123
    assert called["get_paginated"] == ("suburbs", 250, 50, True)
    assert called["threadpool"][1] == ("suburbs", 250, 50, True)
