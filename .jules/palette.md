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

## 2026-04-08 - Missing ARIA Labels on Generic Icon Buttons
**Learning:**
Generic icon-only buttons (like `<X>` icons used for closing modals, dismissing errors, or clearing searches) frequently lack `aria-label` attributes and rely only on visual context in this application.
**Action:**
When adding or modifying generic utility buttons, always explicitly add descriptive `aria-label`s (e.g., `aria-label="Clear search"`, `aria-label="Dismiss error"`) to these interactive elements to ensure screen-reader accessibility.
