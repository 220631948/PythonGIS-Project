## 2025-05-20 - Sidebar Tab Accessibility
**Learning:** Automated accessibility tools flag `aria-controls` references to non-existent IDs as critical errors, and tabs require a corresponding element with `role="tabpanel"` and matching `id`.
**Action:** When implementing tab interfaces, always ensure the content container has `role="tabpanel"`, a unique `id` matching the tab's `aria-controls`, and `aria-labelledby` pointing back to the tab button.
