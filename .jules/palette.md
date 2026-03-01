# Palette's Journal

## Critical UX and Accessibility Learnings

## 2026-03-05 - Missing Descriptive ARIA Labels on Layer Toggles
**Learning:** Found that generic `aria-label="Show layer"` and `aria-label="Hide layer"` on multiple repeated layer toggle buttons creates an ambiguous experience for screen reader users, since they can't distinguish which layer they are toggling without additional context. Decorative icons (like `Eye` / `EyeOff`) were also lacking `aria-hidden="true"`, adding unnecessary noise.
**Action:** When mapping over repeated components with icon-only or visually minimal buttons (like layer lists, lists of cards), dynamically insert the item's name into the `aria-label` (e.g. `aria-label="Hide ${layer.name} layer"`) and hide the decorative SVG icons from screen readers using `aria-hidden="true"`.
