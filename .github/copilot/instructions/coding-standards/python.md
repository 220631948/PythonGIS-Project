# Python Coding Standards

## Type Hinting Rules

- All function parameters must have type hints
- All function return types must be specified
- Use `Optional` for nullable types
- Use `Union` sparingly prefer `Protocol` for flexibility
- Import types from `typing` module

## Async Patterns

- All API routes must be `async`
- Database operations use async session
- Wrap GeoPandas in `asyncio.to_thread`
- Never block event loop with sync operations
- Use async context managers for cleanup

## Module Boundaries

- Keep business logic in `app/core`, `app/utils`, or `app/spatial_analysis` modules.
- Keep route handlers thin; avoid direct DB calls in routers.
- Use dependency injection (`Depends`) for shared utilities or services when needed.
- Raise domain-specific exceptions instead of leaking database errors.

## Spatial Operations

- Always specify CRS explicitly
- Validate geometries before operations
- Transform to appropriate CRS for calculations
- Use EPSG 4326 for storage EPSG 32734 for metrics
- Handle null and invalid geometries gracefully

## Testing

- Use pytest markers for test categorization
- Mock external dependencies
- Test edge cases for spatial operations
- Achieve minimum 70% coverage
- Use descriptive test names

