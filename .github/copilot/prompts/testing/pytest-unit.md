# Generate Pytest Unit/Integration Tests

**Context requirements:**
- Target module/function and expected behavior
- Fixtures available from `tests/conftest.py` (e.g., app_client, dataset fixtures)
- CRS assumptions and sample GeoJSON inputs
- Whether test is unit (fast) or integration (DB/spatial stack)

**Prompt structure:**
- Describe scenario and inputs clearly
- Request parametrized cases (happy path + edge cases)
- Ask for fixtures/mocks for external HTTP and file I/O
- Require assertions on CRS, geometry validity, and response codes
- Include markers (`@pytest.mark.slow` or `@pytest.mark.integration`) when applicable

**Example usage:**
- "Write unit tests for portal_api.get_datasets with mocked Open Data responses"
- "Integration test for suitability_api to ensure CRS 32734->4326 roundtrip"
