# Ralph's Special Improvement Plan 🍌

*"Me fail project completion? That's unpossible!"*

Here is the sequential plan to make your PythonGIS project the most special project in the whole school.

## Phase 1: The "Real Boy" Features (Backend Logic)

**Problem:** The `SiteSuitabilityAnalyzer` is just pretending! It's using placeholder data like a diorama.
**Goal:** Make it use real PostGIS queries so it's smart like Lisa.

### AgentPrompt 1: "Suitability Brain Transplant"
```bash
# Save this to agents/prompts/ralph-task-1.md

Role: GIS Logic Expert
Task: Implement real PostGIS SQL queries in `app/spatial_analysis/site_suitability.py`.
Context:
  - Current methods `_eval_flood_risk` and `_eval_biodiversity` return random numbers.
  - We have a `postgis_db` connection available in `app/core/database.py`.
Instructions:
  1. Replace the random float generation with `SELECT ST_Intersects(...)` queries.
  2. Use `ST_Area` to calculate the percentage of overlap between the site polygon and risk layers.
  3. Ensure the `score` is calculated based on real intersection area.
  4. "I'm a unit test!" -> Write a test in `tests/test_suitability.py` that mocks the DB and checks the math.
```

## Phase 2: The "Big Clean" (UI Refactor)

**Problem:** `frontend/src/App.css` is 3700 lines long! It's like a run-on sentence that never ends.
**Goal:** Break it into smaller pieces so it doesn't hurt our eyes.

### AgentPrompt 2: "CSS Lego Bricks"
```bash
# Save this to agents/prompts/ralph-task-2.md

Role: Frontend Clean-up Crew
Task: Refactor `frontend/src/App.css` into modular CSS or Tailwind utility classes.
Context:
  - The file is huge (3700+ lines).
  - React components in `frontend/src/components/` should have their own styles.
Instructions:
  1. Create `frontend/src/components/Sidebar.module.css` and move sidebar rules there.
  2. Create `frontend/src/components/Map.module.css` for map styles.
  3. Replace global class names in `App.tsx` with module imports (e.g., `styles.sidebar`).
  4. "My cat's breath smells like refactoring." -> Remove the moved lines from `App.css`.
```

## Phase 3: "Everyone Can Play" (Accessibility)

**Problem:** The `SkipLink` doesn't skip to anything, and the buttons are hiding from screen readers.
**Goal:** Make the app accessible so Super Nintendo Chalmers doesn't yell at us.

### AgentPrompt 3: "Accessibility Helper"
```bash
# Save this to agents/prompts/ralph-task-3.md

Role: A11y Guardian
Task: Fix accessibility violations in `frontend/src/App.tsx` and components.
Context:
  - `SkipLink` needs a valid target ID (`#main-content`).
  - Search inputs are missing `aria-label`.
Instructions:
  1. Add `id="main-content"` to the `<main>` tag in `App.tsx`.
  2. Find all `<button>` tags without text and add `aria-label="..."`.
  3. Ensure color contrast on the map controls (they look a bit pale).
  4. Run the "Lighthouse" check in your head and fix the red scores.
```

## Phase 4: "Go Fast Stripes" (Performance)

**Problem:** GeoPandas is blocking the event loop like a tractor on a highway.
**Goal:** Make it async so the app feels fast like a rocket.

### AgentPrompt 4: "Async Speedster"
```bash
# Save this to agents/prompts/ralph-task-4.md

Role: Python Async Expert
Task: Offload blocking GeoPandas operations in `app/core/data_loader.py`.
Context:
  - `get_paginated_gdf` calls synchronous file I/O and geometric operations.
Instructions:
  1. Wrap the GeoPandas `read_file` and coordinate transform calls in `run_in_threadpool`.
  2. Use `await` for these operations in the FastAPI endpoints.
  3. "I'm helping!" -> Verify that the server doesn't freeze when loading a big shapefile.
```

## How to Run the Loop (Ralph Style)

You can run these tasks one by one using the Ralph orchestrator you built!

```bash
# 1. First, create the task files from the prompts above
# (You can use the 'write_file' tool or copy-paste them)

# 2. Run the loop!
./agents/ralph/run.sh tasks/ralph-task-1.json
./agents/ralph/run.sh tasks/ralph-task-2.json
# ... and so on!
```
