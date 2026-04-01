## 2025-02-18 - ARIA Labels for Dismiss/Skip actions

**Learning:**
Icon-only dismiss actions, such as the "X" buttons used to clear errors in components like `AlertSubscriptionManager` or to skip sections like `GuidedTour`, often lack descriptive `aria-label`s. Relying solely on the visual "X" icon leaves screen reader users without context about what is being dismissed.

**Action:**
When working with dismissible banners, toasts, or guided overlays, explicitly add an `aria-label` to the close button that details the action (e.g., `aria-label="Dismiss error"` or `aria-label="Skip tour"`) instead of relying on generic "Close" labels.
