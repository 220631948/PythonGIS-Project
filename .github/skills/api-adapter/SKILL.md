---
name: api-adapter
description: Generate typed SDKs from OpenAPI/GraphQL schemas and detect contract mismatches
metadata:
  version: 0.1.0
  required_tools: ["api_schema_validate", "workspace_file_ops"]
---

# API Adapter Skill

## Purpose

Maintain frontend-backend API contract integrity:

- Compare frontend TypeScript types with backend Pydantic models
- Detect breaking changes
- Generate typed API clients
- Create adapter layers for non-breaking migrations
- Validate request/response payloads

## Usage

```bash
agent invoke api-adapter --validate-contracts
agent invoke api-adapter --generate-client
agent invoke api-adapter --detect-breaking-changes
```

## Checks

1. **Type Matching**: Frontend `types/api.ts` vs Backend DTOs
2. **Endpoint Validation**: All frontend API calls have corresponding backend routes
3. **Payload Validation**: Sample payloads match schemas
4. **Breaking Changes**: Field removals, type changes flagged

## Output

```json
{
  "mismatches": [
    {
      "endpoint": "/api/services/access",
      "field": "service_type",
      "frontend_type": "string",
      "backend_type": "ServiceType (enum)",
      "severity": "warning",
      "recommended_fix": "Update frontend to use enum"
    }
  ],
  "breaking_changes": [],
  "adapter_generated": false
}
```

## Integration

Works with:

- FastAPI OpenAPI schema (`/docs`)
- TypeScript type definitions (`frontend/src/types/api.ts`)
- Pydantic models (`app/models/`)
