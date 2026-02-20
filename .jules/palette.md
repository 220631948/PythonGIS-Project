# Palette's Journal

## 2026-02-20 - Notification Accessibility

**Learning:** Toast notifications often lack `role="alert"` or `role="status"`, making them invisible to screen readers.
**Action:** Always add `role` and `aria-live` attributes to notification components. Ensure close buttons have `aria-label`.
