---
name: ui-crawler
description: Interactive element discovery and visual regression harness using browser automation
metadata:
  version: 0.1.0
  required_tools: ["browser_automation", "terminal_runner"]
---

# UI Crawler Skill

## Purpose

Automated UI interaction testing:

- Crawl all routes and enumerate interactive elements
- Simulate clicks, taps, keyboard interactions
- Verify network calls and responses
- Capture screenshots for visual regression
- Detect broken links and dead buttons

## Usage

```bash
agent invoke ui-crawler --base-url http://localhost:5173
agent invoke ui-crawler --crawl-depth 3 --capture-screenshots
```

## Process

1. Start dev server (if not running)
2. Launch headless browser (Playwright)
3. Discover all routes
4. For each route:
   - Enumerate clickable elements
   - Simulate interaction
   - Verify focus management
   - Check network responses
   - Capture screenshots
5. Generate visual regression baseline or diff

## Output

```json
{
  "routes_crawled": 12,
  "interactive_elements": 47,
  "broken_links": [],
  "dead_buttons": [
    {
      "selector": "#export-button",
      "route": "/dashboard",
      "reason": "no-onclick-handler"
    }
  ],
  "screenshots": ".github/artifacts/ui-audit/"
}
```

## Integration

Integrates with:

- Playwright for browser automation
- Axe-core for accessibility checks (via accessibility-auditor skill)
- Visual regression tools (Percy, Chromatic, or custom)
