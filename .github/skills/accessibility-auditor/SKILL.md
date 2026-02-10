---
name: accessibility-auditor
description: WCAG 2.1 AA compliance checking with axe-core and remediation patch generation
metadata:
  version: 0.1.0
  required_tools: ["browser_automation", "workspace_file_ops"]
  wcag_level: "AA"
---

# Accessibility Auditor Skill

## Purpose

Ensure WCAG 2.1 AA compliance:

- Run axe-core automated accessibility checks
- Verify keyboard navigation
- Check ARIA attributes and labels
- Validate color contrast (4.5:1 for text)
- Detect focus traps and missing focus indicators
- Generate remediation patches

## Usage

```bash
agent invoke accessibility-auditor --audit-url http://localhost:5173
agent invoke accessibility-auditor --generate-remediations
agent invoke accessibility-auditor --verify-wcag-aa
```

## Checks

1. **Keyboard Navigation**: All interactive elements reachable via Tab
2. **ARIA**: Proper roles, labels, and live regions
3. **Color Contrast**: Text meets 4.5:1, large text meets 3:1
4. **Focus Management**: Visible focus indicators, no traps
5. **Semantic HTML**: Proper use of `<nav>`, `<main>`, `<section>`, etc.
6. **Alt Text**: All images have meaningful alt attributes
7. **Form Labels**: All inputs have associated labels

## Integration

- Uses Playwright + axe-core for automated scanning
- Integrates with ui-crawler for full route coverage
- Generates patches for common fixes (missing alt text, ARIA labels)

## Output

```json
{
  "violations": [
    {
      "id": "label",
      "impact": "critical",
      "description": "Form elements must have labels",
      "nodes": [
        {
          "html": "<input type=\"text\" placeholder=\"Search\">",
          "target": ["#search-input"]
        }
      ]
    }
  ],
  "passes": 42,
  "incomplete": 3,
  "remediation_patches": [
    {
      "file": "frontend/src/components/SearchBar.tsx",
      "patch_path": ".github/patches/a11y-001-search-label.patch"
    }
  ]
}
```

## Playwright Test Generation

Generates Playwright tests under `frontend/tests/a11y/` that reproduce fixed scenarios:

```typescript
// Auto-generated accessibility test
test("Search input has accessible label", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.locator("#search-input");
  await expect(searchInput).toHaveAccessibleName("Search locations");
});
```

## Configuration

`.github/skills/accessibility-auditor/config.yaml`:

```yaml
wcag_level: "AA"
axe_rules:
  enabled:
    - label
    - button-name
    - image-alt
    - color-contrast
    - aria-roles
  disabled: []

auto_fix:
  enable: true
  patch_location: ".github/patches/"

generate_tests: true
test_location: "frontend/tests/a11y/"
```

## Cape Town GeoHub Specific Checks

- Map controls have keyboard alternatives (per AGENTS.md)
- All map layers have text descriptions
- Sidebar navigation is keyboard-accessible
- Dark mode meets contrast requirements
- Icons have aria-label attributes (lucide-react)
