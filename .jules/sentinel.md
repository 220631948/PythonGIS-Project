## 2024-03-01 - [Missing Admin Auth on Notification Endpoints]
**Vulnerability:** The `/alerts/create` and `/stats` endpoints in `app/api/notifications_api.py` were meant to be admin-only (as per docstrings) but lacked the `Depends(require_admin_key)` dependency, making them accessible to unauthenticated users.
**Learning:** In FastAPI, it's easy to write a route and document it as admin-only but forget to actually enforce it via a dependency in the decorator.
**Prevention:** Always verify that endpoints intended for admins explicitly include `dependencies=[Depends(require_admin_key)]` in their `@router` decorators.

## 2024-03-01 - [Async Test execution]
**Vulnerability:** Tests calling asynchronous endpoints were defined synchronously and lacking `await`. This led to the `coroutine` warning and meant the actual endpoint logic wasn't fully verified.
**Learning:** Testing `async def` endpoints in FastAPI directly requires the test function to also be `async def`, decorated with `@pytest.mark.anyio`, and the endpoint call must be `await`ed. Furthermore, when mocking database calls for async endpoints, `AsyncMock` (from `unittest.mock`) should be used instead of `MagicMock`.
**Prevention:** Ensure all tests for async code are properly decorated, `await` their targets, and use appropriate async mocks.
