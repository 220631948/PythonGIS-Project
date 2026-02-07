## 2026-02-07 - Async HTTP Requests for Data Status
**Learning:** Checking multiple external endpoints synchronously is a major bottleneck (50s vs 11s). `httpx` and `asyncio.gather` are extremely effective for I/O-bound tasks. Also, `pytest-asyncio` might not be installed, so `@pytest.mark.anyio` is a good alternative when `anyio` is present.
**Action:** Always check for sync I/O in loops and replace with async where possible. Check available pytest plugins before writing async tests.
