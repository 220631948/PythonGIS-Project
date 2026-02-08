# Generate FastAPI Endpoint Following Project Patterns

**Context requirements:**

- Endpoint purpose and HTTP method
- Request and response schemas
- Service layer dependencies
- Pagination or filtering needs
- Authentication requirements

**Prompt structure:**

- Define route path under `/api` (use `settings.API_PREFIX`)
- Specify Pydantic request model
- Request service injection using Depends
- Ask for error handling with custom exceptions
- Include OpenAPI documentation
- Add response model wrapping
