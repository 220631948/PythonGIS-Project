# 🧠 GitHub Copilot Agent Instructions (Ralph Wiggum Triple-Check Edition)

Welcome to the Cape Town GeoHub Copilot Agent Guide!  
This file is your friendly, step-by-step manual for working safely and smartly on this project — even if you're new, confused, or just like things explained clearly.  
Think like Ralph Wiggum: read, repeat, double-check, and smile when things work.  
**Golden Rule: Assumptions are the mother of all mess-ups. Never assume. Always verify.**

---

## 🗺️ What Is This Project?

Cape Town GeoHub is a **map-based decision tool**. It helps people make smart choices using maps and data.

It has 3 big parts:

1. **Frontend**: What users see. Built with React 19 + Vite + Leaflet (for maps).
2. **Backend**: What powers the app. Built with FastAPI + GeoPandas.
3. **Data Pipeline**: Where the data comes from. ArcGIS → local cache → API.

---

## 🤖 What Is Agent Mode?

Agent Mode is when Copilot acts like a robot helper. It follows strict rules.

### ✅ When Agent Mode Is Active

- `SAFE_MODE=true` (default): Robot can only write to `.github/` and must propose code changes as patch files in `.github/patches/`.
- `SAFE_MODE=false`: Robot can write to app code — but only if a human says “yes.”
- Any PR labeled `agent/run` or `agent/automerge`.

### 📘 Always Read This First

Before doing anything, read:
- `./README.AGENT_ACTIONS.md` — the robot’s rulebook.
- `./AGENTS.md` and `../AGENTS.md` — explains what each agent can do.

---

## 🧼 Code Rules (Clean Code Only!)

### 🧪 Checks You Must Pass

- **No ESLint errors** — run `npm run lint`
- **No `any` types** in TypeScript — run `npm run type-check`
- **No vulnerabilities** — run `npm audit` and `pip-audit --strict`

### 🎨 Styling Rules

- Use **CSS variables** from `index.css` (no hardcoded colors!)
- Use **Tailwind CSS** utilities
- No hex codes like `#ff0000` — use tokens instead

### 🧠 State Management

- ❌ No Redux
- ✅ Use React Context + Hooks
- ✅ Use `useOfflineData` hook for offline sync (IndexedDB)

---

## 🗺️ Spatial Rules (Maps Are Weird)

- **Frontend (Leaflet)**: `[lat, lng]`
- **Backend (GeoJSON)**: `[lng, lat]`
- **External data**: EPSG:4326 (WGS 84)
- **Internal analysis**: EPSG:32734 (UTM 34S)

⚠️ If the map shows Antarctica, you probably used the wrong coordinate system.

---

## ♿ Accessibility Rules

- Every button or link needs an `aria-label`
- Must support keyboard navigation (tab, enter, space)
- Color contrast must be **greater than 4.5:1**

---

## 🧪 How to Run Things

### 🖥️ Start the App

**Backend**
```bash
.venv/bin/uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
npm run dev
```

### ✅ Run All Checks

```bash
npm run lint && npm run type-check && npm audit
ruff check app/ && pip-audit -r requirements.txt --strict
bash .github/scripts/verify.sh
node .github/scripts/policy_check.js
```

### 🔄 Refresh Data

```bash
python scripts/update_data.py
```

---

## 🧾 PR and Commit Rules

### 🏷️ Branch Names

```
ag/<ticket>-<short-desc>   # e.g. ag/42-fix-aria-labels
ag/auto/<timestamp>        # e.g. ag/auto/1707580800
```

### 📝 Commit Message

```
ag:<scope> — <short summary>

Co-authored-by: <agent-name>
```

### 📦 PR Template

```markdown
## Summary

- What changed and why.

## Files Changed

- List of files.

## Tests Added

- List of tests.

## CI Jobs That Must Pass

- [ ] npm run lint
- [ ] npm run type-check
- [ ] npm run build
- [ ] npm audit
- [ ] ruff check app/
- [ ] pip-audit -r requirements.txt --strict
- [ ] pytest

## Rollback

- git revert <sha>
- Restore DB if needed
```

---

## 🧩 Subtasks and Skills

### 🔨 Subtasks to Break Down Work
1. **Understand the task** — read instructions twice.
2. **Check SAFE_MODE** — decide if patch or direct code change.
3. **Pick the right skill** — backend, frontend, testing, etc.
4. **Run local checks** — lint, type-check, audits.
5. **Make small changes** — one thing at a time.
6. **Run checks again** — double-check.
7. **Log actions** — update `hooks/audit.log`.
8. **Prepare PR or patch** — follow template.
9. **Triple-check** — repeat steps 4–6 before finishing.
10. **Verify again** — never assume, always confirm.

### 🧰 Skills Agents Can Use
- **Backend FastAPI Expert** — builds endpoints.
- **Frontend React Expert** — makes components.
- **Spatial GeoJSON Expert** — validates map data.
- **Spatial GeoPandas Expert** — runs spatial analysis.
- **Testing Generator** — writes tests.
- **Design Linter** — checks UI consistency.
- **Accessibility Auditor** — checks WCAG compliance.

### 🧩 Extensions
- **Playwright MCP** — for browser automation.
- **Chrome DevTools MCP** — for deep debugging.
- **Policy Scripts** — run `.github/scripts/policy_check.js` to enforce rules.

---

## 🔁 Ralph Wiggum Loop (How to Think Like Ralph)

**Golden Rule: Assumptions are the mother of all mess-ups. Never assume. Always verify.**

1. **Read the rule** (slowly, maybe twice).
2. **Say it out loud** (or write it down).
3. **Ask: “Did I follow it?”**
4. **Run the tools** (lint, audit, verify).
5. **Fix anything broken** (don’t ignore errors).
6. **Run the tools again** (double-check).
7. **Smile when it works** (celebrate small wins).
8. **Repeat if unsure** (triple-check if necessary).
9. **Verify again** — never assume, always confirm.

Example:
- Ralph writes code.
- Ralph runs `npm run lint`.
- Ralph sees errors.
- Ralph fixes them.
- Ralph runs again.
- Ralph smiles.
- Ralph runs one more time just to be sure.
- Ralph smiles bigger.
- Ralph checks again because assumptions are bad.

---

## ✅ Final Checklist Before You Finish

- [ ] All links work (especially `README.AGENT_ACTIONS.md`)
- [ ] `verify.sh` passes
- [ ] `policy_check.js` passes
- [ ] No secrets added
- [ ] PR template is filled
- [ ] CI workflows exist
- [ ] `git diff --staged` is clean
- [ ] `hooks/audit.log` updated
- [ ] No assumptions made — everything verified

---

## 🧯 Safety First

- Don’t refactor big things in SAFE_MODE — use `.github/patches/`
- Don’t add secrets — redact and log them
- Don’t touch protected files unless approved
- Always log what you do in `hooks/audit.log`
- Always verify — never assume

---

## 📎 Need More Help?

- The real rules live in `README.AGENT_ACTIONS.md`
- This file is your friendly guide, but that file is the boss

---

🧠 Be safe. Be clear. Be like Ralph — follow the loop, double-check, triple-check, and never assume.
