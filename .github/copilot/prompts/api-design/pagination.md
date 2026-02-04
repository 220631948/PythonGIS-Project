# Add Pagination & Filtering to Endpoint

**Context requirements:**
- Endpoint purpose and dataset size
- Desired filters (bbox, category, date range)
- Default page size and limits
- Ordering fields and indexes

**Prompt structure:**
- Define query params with validation and sane defaults
- Use service/data loader for filtered queries; avoid full scans
- Return structured pagination metadata (page, page_size, total)
- Add examples in OpenAPI docstring
- Include tests (unit + integration) for pagination edges

**Example usage:**
- "Add pagination to portal datasets endpoint with bbox filtering"
- "Filter suitability scores by category and date with paginated results"
