import importlib

import app.utils.sentry_utils as su


def test_attach_geo_context_sets_tags(monkeypatch):
    tags = {}

    class DummyScope:
        def set_tag(self, k, v):
            tags[k] = v

    class DummySentry:
        def configure_scope(self):
            class CM:
                def __enter__(self_):
                    return DummyScope()

                def __exit__(self_, exc_type, exc_val, exc_tb):
                    return False

            return CM()

    importlib.reload(su)

    # Replace module-level sentry_sdk with our dummy implementation
    monkeypatch.setattr(su, "sentry_sdk", DummySentry(), raising=False)

    su.attach_geo_context(dataset_id="mydataset", centroid=[18.4241999, -33.9248687], bbox=[18.4, -33.92, 18.45, -33.93])

    assert tags["dataset_id"] == "mydataset"
    assert tags["centroid"].startswith("18.4242")
    assert tags["bbox"].startswith("18.4")


def test_make_map_link_and_attach(monkeypatch):
    # Simple geolink creation
    link = su.make_map_link([18.4241999, -33.9248687], zoom=12, layers=['clinics'])
    assert 'center=' in link
    assert 'zoom=12' in link

    extras = {}

    class DummyScope:
        def set_extra(self, k, v):
            extras[k] = v

    class DummySentry:
        def configure_scope(self):
            class CM:
                def __enter__(self_):
                    return DummyScope()

                def __exit__(self_, exc_type, exc_val, exc_tb):
                    return False

            return CM()

    monkeypatch.setattr(su, "sentry_sdk", DummySentry())
    su.attach_map_link([18.4241999, -33.9248687], zoom=12, layers=['clinics'])

    assert "reproducible_map_url" in extras
    assert "zoom=12" in extras["reproducible_map_url"]
