import importlib

import pytest

import app.config as config
import app.sentry_ as sentry_module


def test_init_sentry_uses_env_settings(monkeypatch):
    monkeypatch.setenv("SENTRY_DSN", "https://public@sentry.invalid/1")
    monkeypatch.setenv("SENTRY_ENVIRONMENT", "test")
    monkeypatch.setenv("SENTRY_TRACES_SAMPLE_RATE", "0.25")
    monkeypatch.setenv("GIT_SHA", "abc123")
    monkeypatch.setenv("SENTRY_SEND_DEFAULT_PII", "false")

    importlib.reload(config)
    importlib.reload(sentry_module)

    init_kwargs = {}

    def fake_init(**kwargs):
        init_kwargs.update(kwargs)

    # Ensure there's a sentry_sdk object with an init we can stub
    if getattr(sentry_module, "sentry_sdk", None) is None:
        monkeypatch.setattr(sentry_module, "sentry_sdk", type("SDK", (), {})(), raising=False)

    # Allow setting init even if it didn't exist
    monkeypatch.setattr(sentry_module.sentry_sdk, "init", fake_init, raising=False)

    sentry_module.init_sentry()

    assert init_kwargs["dsn"] == "https://public@sentry.invalid/1"
    assert init_kwargs["environment"] == "test"
    assert init_kwargs["traces_sample_rate"] == pytest.approx(0.25)
    assert init_kwargs["release"] == "abc123"
    assert init_kwargs["send_default_pii"] is False


def test_before_send_scrubs_headers_and_rounds_coords():
    event = {
        "request": {
            "headers": {
                "authorization": "secret",
                "cookie": "sessionid",
                "x-api-key": "kept",
            }
        },
        "extra": {
            "bbox": [18.4241999, -33.9248687],
            "centroid": (18.5000123, -33.9000456),
        },
    }

    scrubbed = sentry_module.before_send(event, None)

    assert "authorization" not in scrubbed["request"]["headers"]
    assert "cookie" not in scrubbed["request"]["headers"]
    assert scrubbed["request"]["headers"]["x-api-key"] == "kept"
    assert scrubbed["extra"]["bbox"][0] == pytest.approx(18.4242, abs=1e-4)
    assert scrubbed["extra"]["centroid"][1] == pytest.approx(-33.9000, abs=1e-4)