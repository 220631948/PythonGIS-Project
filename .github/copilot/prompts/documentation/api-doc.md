# Generate API Documentation Snippet

**Context requirements:**

- Endpoint path, method, and purpose
- Request body/query params and schemas
- Response schemas (GeoJSON, DTOs) and CRS expectations
- Error conditions and rate limits

**Prompt structure:**

- Provide short description and summary
- List parameters with types and defaults
- Include request/response examples (GeoJSON RFC 7946)
- Note CRS (input/output) and validation rules
- Add pagination/simplify parameters when applicable

**Example usage:**

- "Document /api/portal/datasets?category=services"
- "Document suitability analysis endpoint with polygon request body"
