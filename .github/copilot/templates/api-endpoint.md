# API Endpoint Template

**Purpose**
Create new versioned endpoint.

**Required Components**
- Route function with service injection
- Pydantic request and response models
- OpenAPI documentation
- Error handling
- Response wrapping
- Unit and integration tests

**Pattern**
- Define in `app/api/<module>.py` (mounted under `settings.API_PREFIX`, default `/api`)
- Create schemas in `app/models` (Pydantic response/request models)
- Implement logic in `app/core`, `app/utils`, or `app/spatial_analysis`
- Add tests in `tests/` (unit/integration as needed)
