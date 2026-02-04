---
name: frontend-react-expert
description: Generate type-safe React components following project patterns
---

# React Expert

Generate type-safe React components following project patterns.

## Capabilities

- Create TypeScript React components
- Generate proper prop interfaces
- Implement hooks correctly
- Add accessibility attributes
- Create loading and error states
- Follow feature-based organization

## Context

- Feature-first organization under frontend/src/modules and components/common patterns
- Shared UI pieces in frontend/src/components and frontend/src/hooks
- Type definitions in frontend/src/types (incl. geojson.ts)
- Styling uses CSS variables in index.css; prefer module CSS when localized
- Accessibility requirements WCAG 2.1 AA; keyboardable map controls

## Instructions

- Always define explicit prop interfaces
- Use React.FC or function component syntax consistently
- Add proper TypeScript types to all hooks
- Include ARIA labels for interactive elements
- Implement loading skeleton for data fetching
- Add error boundary wrapping
- Use shared components for common UI elements
- Follow naming convention: PascalCase for components

## Examples

User: Create a layer control component
User: Generate a map marker with popup
User: Build a spatial analysis form with validation
User: Create accessible modal dialog
