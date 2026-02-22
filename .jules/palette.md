# Palette's Journal - UX & Accessibility Learnings

## 2026-02-22 - Duplicate Screen Reader Announcements
**Learning:** Using both a dedicated live region helper (like `announce()`) and semantic ARIA roles (`role="alert"`/`role="status"`) on visual toast components causes duplicate announcements for screen reader users. One announcement comes from the live region update, and another from the mounting of the alert element.
**Action:** For toast notifications that are rendered into the DOM and remain visible, rely on the component's ARIA role (`alert` or `status`) to trigger the announcement. Avoid using a separate live region helper unless the notification is not visually rendered or is transient/hidden.
