import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.mark.skipif(not pytest.importorskip('pandas'), reason="pandas required")
def test_filter_schema_attaches_geo_context(monkeypatch):
    # Ensure geopandas present for module imports
    pytest.importorskip('geopandas')

    import app.main as main_mod
    importlib.reload(main_mod)

    called = {}

    def dummy_attach(**kwargs):
        called.update(kwargs)

    monkeypatch.setattr('app.utils.sentry_utils.attach_geo_context', dummy_attach)

    # Mock data_loader.get_gdf to return a simple DataFrame-like object
    import pandas as pd

    def fake_get_gdf(name):
        return pd.DataFrame({'id': [1, 2], 'value': [10, 20]})

    monkeypatch.setattr('app.api.filter_api.data_loader', type('D', (), {'get_gdf': staticmethod(fake_get_gdf)}))

    client = TestClient(main_mod.app)

    resp = client.get('/filter/schema/testdataset')

    assert resp.status_code == 200
    assert 'dataset_id' in called and called['dataset_id'] == 'testdataset'


@pytest.mark.skipif(not pytest.importorskip('pandas'), reason="pandas required")
def test_validate_topology_attaches_geo_context(monkeypatch):
    pytest.importorskip('geopandas')

    import app.main as main_mod
    importlib.reload(main_mod)

    called = {}

    def dummy_attach(**kwargs):
        called.update(kwargs)

    monkeypatch.setattr('app.utils.sentry_utils.attach_geo_context', dummy_attach)

    # Mock data_loader.get_gdf to return a non-empty DataFrame
    import pandas as pd

    def fake_get_gdf(name):
        return pd.DataFrame({'geometry': [1, 2]})

    monkeypatch.setattr('app.api.advanced_analysis_api.data_loader', type('D', (), {'get_gdf': staticmethod(fake_get_gdf)}))

    client = TestClient(main_mod.app)

    resp = client.get('/analysis/topology/validate/testdataset')

    assert resp.status_code == 200
    assert 'dataset_id' in called and called['dataset_id'] == 'testdataset'
