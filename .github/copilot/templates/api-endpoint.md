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
- Define in `app/api/v1/module.py`
- Create schemas in `app/models/schemas`
- Implement logic in `app/services`
- Add tests in `tests/unit` and `tests/integration`
