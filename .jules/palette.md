## 2026-02-25 - Notification Accessibility Gaps
**Learning:** Custom notification components often lack `role="alert"`/`role="status"` and accessible close buttons, rendering them invisible to screen readers despite being highly visual.
**Action:** Always audit toast/notification components for ARIA roles and keyboard accessibility immediately upon discovery.
