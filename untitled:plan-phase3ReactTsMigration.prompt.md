## Plan: Phase 3 React Component Migration (JSX to TSX)

Migrate all remaining 26 React components from JavaScript to TypeScript to ensure type safety and reduce runtime errors. This process is strictly non-breaking: we rename files, preserve runtime behavior, and then tighten types incrementally. New abstractions (utility hooks/atomic components) are introduced only if reuse is strictly necessary (>= 3 usages).

**Core Principles**
- **Map to Existing**: Use `useGeoData.ts` instead of creating `useMapData`. Place utils in `frontend/src/lib/` unless `src/utils/` already exists.
- **Incremental**: `any` types are acceptable temporarily to keep the build green, then refined.
- **Config Stability**: Keep `vite.config.js` as JS.
- **Hardening**: Fix `main.tsx` root guard.

**Steps**

1.  **Hardening & Setup**
    - [ ] **main.tsx**: Remove non-null assertion; add explicit `root` element check and error throw.
    - [ ] **TS Config**: Verify `tsconfig.json` includes all source files (ensure `.jsx` isn't excluded implicitly before renaming).

2.  **Shared Logic (Extraction Strategy)**
    - [ ] Scan components for reusable geometry/formatting logic. If found > 2 times, extract to `frontend/src/lib/utils.ts`.
    - [ ] Create `useDebounce.ts` or `useLocalStorage.ts` *only* if duplicated logic is found during component migration.

3.  **Migration Batch A: UI Shell & Simple Components**
    - Call *multi_replace* to rename and convert:
    - [ ] `frontend/src/components/Header.jsx` -> `.tsx`
    - [ ] `frontend/src/components/Loading.jsx` -> `.tsx`
    - [ ] `frontend/src/components/Notification.jsx` -> `.tsx`
    - [ ] `frontend/src/components/InstallPrompt.jsx` -> `.tsx`
    - [ ] `frontend/src/components/Legend.jsx` -> `.tsx`
    - [ ] `frontend/src/components/ErrorBoundary.jsx` -> `.tsx`
    - [ ] `frontend/src/components/Accessibility.jsx` -> `.tsx`
    - [ ] `frontend/src/components/GuidedTour.jsx` -> `.tsx`

4.  **Migration Batch B: Core Map & Navigation**
    - [ ] `frontend/src/components/Sidebar.jsx` -> `.tsx` (Define explicit View types).
    - [ ] `frontend/src/components/MapView.jsx` -> `.tsx` (Complex Leaflet types).
    - [ ] `frontend/src/components/LayerPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/FilterPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/SearchAutocomplete.jsx` -> `.tsx` (Autocomplete props).
    - [ ] `frontend/src/components/OfflineDataManager.jsx` -> `.tsx`.

5.  **Migration Batch C: Analysis & Feature Panels**
    - [ ] `frontend/src/components/Dashboard.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/RoutePanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/TransportPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/ExportPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/RealtimePanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/TimeSlider.jsx` -> `.tsx`.

6.  **Migration Batch D: Advanced Tools**
    - [ ] `frontend/src/components/FieldDataPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/DataStatusPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/SiteSuitabilityPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/CollaborationPanel.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/PortalBrowser.jsx` -> `.tsx`.
    - [ ] `frontend/src/components/StyleEditor.jsx` -> `.tsx`.

7.  **Refinement & Verification**
    - [ ] Run `npm run type-check` (fix distinct errors).
    - [ ] Run `npm run build` (confirm successful compilation).
    - [ ] Manual verification of Map interactions and Panel toggles.

**Verification**
- `npm run type-check` returns zero errors.
- `npm run dev` starts without runtime crashes.
- Map loads, layers toggle, and panels open/close correctly.

**Decisions**
- Kept `vite.config.js` to avoid tooling churn.
- Deferred atomic component creation (Button/Card) to avoid "big bang" refactor; inline styles/HTML preserved for now.
