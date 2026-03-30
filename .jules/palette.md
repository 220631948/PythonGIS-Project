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
## $DATE - ARIA Labels for Icon-Only Buttons in Overlays

**Learning:**
Icon-only buttons within global overlays and guided tour interfaces (like the "Start guided tour" HelpButton and "Close tour" button in the `GuidedTour` tooltip) often rely solely on `title` attributes or generic icons without accessible names. This creates barriers for screen reader users who cannot visually interpret the icon or access the hover-based title.

**Action:**
When working with icon-only controls in overlays, tooltips, or any UI components, ensure that descriptive `aria-label` attributes (e.g., `aria-label="Start guided tour"`) are always applied to the interactive `<button>` element to provide a clear accessible name.
