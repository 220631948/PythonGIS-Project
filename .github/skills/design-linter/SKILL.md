---
name: design-linter
description: UI consistency, design token normalization, and design-system extraction
metadata:
  version: 0.1.0
  required_tools: ["codebase_search", "workspace_file_ops"]
---

# Design Linter Skill

## Purpose

Enforces design system consistency:

- CSS variable usage (index.css tokens)
- Hardcoded color detection
- Tailwind utility alignment with design tokens
- Component spacing/sizing consistency
- Dark mode compliance

## Usage

```bash
agent invoke design-linter --scan-styles
agent invoke design-linter --extract-tokens
agent invoke design-linter --validate-darkmode
```

## Checks

1. **Color Tokens**: Detect hardcoded colors (e.g., `#3b82f6`) instead of `var(--accent)`
2. **Spacing**: Verify consistent use of spacing scales
3. **Typography**: Ensure font sizes match design system
4. **Dark Mode**: Validate dark theme styles exist for all components

## Output

```json
{
  "violations": [
    {
      "file": "frontend/src/components/Button.tsx",
      "line": 42,
      "issue": "Hardcoded color #3b82f6 instead of var(--accent)",
      "severity": "warning"
    }
  ],
  "recommendations": ["Extract 12 hardcoded colors to index.css design tokens"]
}
```
