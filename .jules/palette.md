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

## 2024-05-26 - Auto-Dismissing Notifications Accessibility and Usability

**Learning:**
Auto-dismissing toast notifications that rely on a `useEffect` timer can disappear while the user is actively reading them or attempting to interact with them (such as clicking the close button). Additionally, screen readers need to be alerted to new notifications appropriately based on their severity.

**Action:**
When implementing or updating auto-dismissing notifications:
1. Always implement a "pause on hover" feature using `onMouseEnter` and `onMouseLeave` to clear or pause the timeout while the user is interacting with the element.
2. Apply the correct ARIA role based on the notification type: use `role="alert"` for error messages (which requires immediate attention) and `role="status"` for generic or success messages.
3. Apply `aria-hidden="true"` to decorative icons within the notification to prevent redundant reading by screen readers.
