# TypeScript Coding Standards

## Type Safety Rules
- Never use `any` type except in documented exceptional cases
- Always provide explicit return types on functions
- Use strict mode in tsconfig
- Prefer `interface` over `type` for object shapes
- Use discriminated unions for state machines

## Naming Conventions
- PascalCase for components and types
- camelCase for functions and variables
- UPPER_SNAKE_CASE for constants
- Prefix interfaces with `I` only when needed for clarity
- Use descriptive names avoiding abbreviations

## Import Organization
1. React imports first
2. Third-party libraries second
3. Local types and utilities third
4. Relative imports last
5. Use path aliases for shared code

## Component Patterns
- Prefer function components over class components
- Use `React.FC` or explicit typing consistently
- Extract hooks to separate files when complex
- Keep components under 200 lines
- Use composition over prop drilling

## Error Handling
- Wrap async operations in try-catch
- Use Error Boundary for component errors
- Provide user-friendly error messages
- Log errors with context
- Never silently catch errors
