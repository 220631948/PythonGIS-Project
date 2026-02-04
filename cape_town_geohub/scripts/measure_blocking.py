import sys
import os
import time
import asyncio
import httpx
from unittest.mock import MagicMock, patch

# Add the project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.api import realtime_api

async def mocked_response(*args, **kwargs):
    # Simulate network latency (non-blocking)
    await asyncio.sleep(1.0)

    mock = MagicMock()
    mock.is_success = True
    mock.status_code = 200
    mock.json.return_value = {"features": []}
    return mock

async def run_benchmark():
    print("🚀 Starting benchmark with NON-BLOCKING async requests...")

    async def call_refresh(feed_id):
        print(f"  Start refresh {feed_id}")
        # _refresh_feed is now async, so we await it
        result = await realtime_api._refresh_feed(feed_id)
        print(f"  End refresh {feed_id}")
        return result

    # Patch httpx.AsyncClient.get
    # We patch the 'get' method of any AsyncClient instance
    with patch("httpx.AsyncClient.get", side_effect=mocked_response):
        start_time = time.time()

        # Run two refreshes concurrently
        await asyncio.gather(
            call_refresh("traffic_status"),
            call_refresh("service_disruptions")
        )

        end_time = time.time()

    duration = end_time - start_time

    print(f"⏱️  Total duration: {duration:.2f} seconds")
    print(f"   (Expected ~2.0s for blocking, ~1.0s for non-blocking)")

    if duration < 1.9 and duration >= 1.0:
        print("🟢 PASS: Execution was non-blocking.")
    elif duration < 1.0:
        print(f"❓ WARNING: Execution was too fast ({duration:.2f}s). Mock might not have slept?")
    else:
        print(f"🔴 FAIL: Execution was blocking ({duration:.2f}s).")

if __name__ == "__main__":
    asyncio.run(run_benchmark())
