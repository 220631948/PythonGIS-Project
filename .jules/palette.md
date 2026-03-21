## 2024-05-24 - Semantic HTML and ARIA Enhancements in Interactive Components

**Learning:**
The application occasionally uses generic HTML elements (`<div>`) for interactive controls such as color swatches (`.color-swatch`) and expandable headers (`.style-editor-header`), relying entirely on `onClick` handlers. Additionally, when attempting to wrap an entire header containing child actions (like a "Reset" button) in a `<button>`, it creates invalid HTML (nested buttons) which breaks the DOM and accessibility tree.

**Action:**
When adding accessibility to interactive elements:
1. Convert clickable `<div>` swatches or isolated actions to `<button type="button">`.
2. For container elements (like accordion headers) that include child buttons, DO NOT convert the container to a `<button>`. Instead, keep it as a `<div>` and use `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler (listening for 'Enter' or ' ') to ensure keyboard accessibility without nesting interactive elements.
3. Always supply `aria-label`s to icon-only buttons and `aria-expanded` attributes to elements that toggle content visibility.
## 2024-05-25 - ARIA Labels for Common UI Icon Buttons

**Learning:**
Many standard icon-only buttons (such as the "X" buttons used to close modals, panels, and notifications) lack `aria-label`s, rendering them inaccessible or confusing for screen reader users. Relying purely on visual icons like `<X size={16} />` without descriptive labels creates a poor user experience.

**Action:**
When adding or updating UI elements like notifications, modals, or side panels, always include a descriptive `aria-label` (e.g., `aria-label="Close notification"`, `aria-label="Close modal"`) on the surrounding `<button>` tag for icon-only controls.
## 2025-01-28 - Dynamic ARIA Labels on Toggle Buttons

**Learning:**
Using dynamic `aria-label`s like `aria-label={isActive ? 'Hide layer' : 'Show layer'}` on toggle buttons that already have an `aria-pressed={isActive}` attribute causes screen reader redundancy and contradictory state announcements. The `aria-pressed` attribute is sufficient to convey the state. Furthermore, attempting to "fix" double-focus on nested interactive elements (like a button inside a focusable div card) by setting `tabIndex={-1}` on the actual button is a critical accessibility regression. It disables keyboard navigation for screen reader users and users navigating interactively, as the button itself can no longer receive focus or be triggered natively.

**Action:**
When implementing toggle buttons that use `aria-pressed`:
1. Use static `aria-label`s like `aria-label={"Toggle " + itemName}` to avoid screen reader redundancy and confusion.
2. Ensure the actual `<button>` remains in the tab order (do not use `tabIndex={-1}`). If the visual design uses a wrapper card that is also focusable, consider removing `tabIndex={0}` from the wrapper and relying on standard semantic HTML elements for interaction, or ensuring the child button is the primary interactive target.
