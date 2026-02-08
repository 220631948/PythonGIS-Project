# Core Utility Module Template

**Purpose**
Create a reusable core utility or helper module for shared backend logic.

**Required Components**

- Utility class or functions with type hints
- Explicit dependencies (pass in client/session, avoid globals)
- Public methods for business operations
- Private helper methods for logic
- Error handling with custom exceptions
- Comprehensive docstrings

**Usage Instructions**

1. Copy template and replace `ModuleName`
2. Place under `app/core` or `app/utils`
3. Define dependency types (DB session, data loader, HTTP client)
4. Implement business methods
5. Add error handling
6. Write unit tests
