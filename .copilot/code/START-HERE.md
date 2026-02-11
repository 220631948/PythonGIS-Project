# 🎯 Start Here: VS Code GitHub Copilot + SUPER-AGENT v3 Integration

**Generated**: 2026-02-10  
**For**: Cape Town GeoHub - MapView Integration Task  
**Framework**: SUPER-AGENT v3  
**Model**: Claude Opus 4.6 via GitHub Copilot

---

## 📦 What You Received

You asked for a prompt tailored for **VS Code GitHub Copilot Agent Mode** that integrates with your existing **SUPER-AGENT v3 infrastructure**. Here's what I created:

### 1. **vscode-copilot-agent-task.md** (PRIMARY TASK FILE)
- 📄 Size: ~25KB
- 🎯 Purpose: Complete task specification for Copilot
- ✨ Includes: 8-phase execution plan, 34 patch templates, success criteria

**Use for**: Main task to paste into VS Code Copilot Chat

### 2. **vscode-copilot-usage-guide.md** (COMPREHENSIVE GUIDE)
- 📄 Size: ~19KB
- 🎯 Purpose: How to use Copilot with SUPER-AGENT v3
- ✨ Includes: Commands, patterns, troubleshooting, examples

**Use for**: Reference while Copilot works on the task

### 3. **QUICK-REFERENCE-COPILOT.md** (QUICK START)
- 📄 Size: ~8KB
- 🎯 Purpose: TL;DR - Everything you need in 5 minutes
- ✨ Includes: Cheat sheet, command reference, checklist

**Use for**: Quick lookups and reminders

### 4. **START-HERE.md** (THIS FILE)
- 🎯 Purpose: Executive summary and decision tree
- ✨ Includes: What to use when, comparison table

---

## 🤔 Which Tool Should You Use?

You have **TWO** complete prompt packages:

### Option A: Claude Code (Terminal)
**Files**:
- `claude-code-mapview-task.md`
- `claude-code-usage-guide.md`
- `QUICK-START-SUMMARY.md`

**Use when**:
- ✅ You want **agent teams** (4 agents working in parallel)
- ✅ Task is **one-off** (no framework overhead)
- ✅ You prefer **terminal workflow**
- ✅ **No existing infrastructure** to integrate with

**Pros**: Faster parallel execution, simpler setup  
**Cons**: No SAFE_MODE, no hooks, no policies, no skills

---

### Option B: VS Code GitHub Copilot (IDE) ⭐ **RECOMMENDED FOR YOU**
**Files**:
- `vscode-copilot-agent-task.md`
- `vscode-copilot-usage-guide.md`
- `QUICK-REFERENCE-COPILOT.md`

**Use when**:
- ✅ You have **SUPER-AGENT v3 framework** (YOU DO!)
- ✅ You need **SAFE_MODE** enforcement
- ✅ You want to use **custom skills** (api-adapter, refactor-strategist, etc.)
- ✅ You need **policy compliance** (no-secrets, dependency-allowlist, etc.)
- ✅ You prefer **IDE-integrated** workflow
- ✅ You want **persistent memory** across tasks

**Pros**: Leverages your existing infrastructure, safer, auditable  
**Cons**: Single agent (no parallelism), more setup

---

## 🎯 Recommendation: Use VS Code Copilot

**Why?** You've already invested in SUPER-AGENT v3 infrastructure:
- ✅ 7 skills ready to use
- ✅ 5 hooks enforcing safety
- ✅ 4 policies as code
- ✅ Memory system
- ✅ Verification scripts
- ✅ CI/CD integration

**Claude Code would bypass all of this!** It would be like having a security system installed and then leaving the door unlocked.

---

## ⚡ Quick Start (VS Code Copilot) - 60 Seconds

### Step 1: Open Your Project
```bash
cd /path/to/cape-town-geohub
code .
```

### Step 2: Open Copilot Chat
- Windows/Linux: `Ctrl+Alt+I`
- Mac: `Cmd+Alt+I`

### Step 3: Initialize Framework
```
@workspace Load .github/AGENTS.md framework. 
I need to run a long task following SUPER-AGENT v3 protocol.
```

### Step 4: Paste Task
```
@workspace [Copy and paste the ENTIRE contents of vscode-copilot-agent-task.md]
```

### Step 5: Monitor Progress
```bash
# Terminal 1: Watch patches being generated
watch -n 2 'ls -lt .github/patches/ | head -20'

# Terminal 2: Monitor hook decisions
tail -f .github/hooks/audit.log | jq

# Terminal 3: Track findings
watch -n 5 'jq ".summary" .github/findings.json'
```

### Step 6: Wait for Completion
Expected duration: **2-3 hours**  
Your involvement: **~30 minutes** (answering questions, validating)

---

## 📊 Comparison: Claude Code vs. VS Code Copilot

| Feature | Claude Code | VS Code Copilot + SUPER-AGENT v3 |
|---------|-------------|----------------------------------|
| **Model** | Opus 4.6 | Opus 4.6 |
| **Interface** | Terminal | VS Code Chat |
| **Agent Teams** | ✅ 4 agents parallel | ❌ Single agent |
| **Context Window** | 1M tokens | 1M tokens (via workspace) |
| **Skills** | ❌ None | ✅ 7 custom skills |
| **Hooks** | ❌ None | ✅ 5 lifecycle hooks |
| **SAFE_MODE** | ❌ Not enforced | ✅ Enforced via BeforeFileWrite |
| **Policies** | ❌ None | ✅ 4 YAML policies |
| **Memory** | ❌ None | ✅ session/project/global |
| **Audit Trail** | ❌ None | ✅ audit.log (JSONL) |
| **Patch Generation** | Manual | ✅ Automatic under .github/patches/ |
| **Verification** | Manual | ✅ verify.sh + policy_check.js |
| **CI Integration** | Manual | ✅ agent-ci.yml workflow |
| **Your Framework** | Ignored | ✅ Fully integrated |

**Verdict**: For your use case (existing SUPER-AGENT v3 infrastructure), **VS Code Copilot is the clear winner**.

---

## 🎯 Your Specific Task: MapView Integration

### Current Issues
```
❌ 6 API endpoints returning 500 errors
   /api/health
   /api/data-status/health
   /api/data-status/eval-log
   /api/geocode/search
   /api/geocode/autocomplete
   /api/reports/dashboard-data

❌ 30+ ERR_CONNECTION_RESET errors
   Resources: 1125, 1126, 1127, 1128, 1129, 1130, 1131
   Static files: 34, 35

❌ React infinite loops
   App.tsx:105 - Maximum update depth exceeded
   OpsStatus.tsx:36 - Health check failed
   Dashboard.tsx:82 - Dashboard load error

❌ MapView layers not rendering
   PostGIS clusters not visible
   Polygons not displaying
   Markers missing
   Heatmap not working
   Routes not showing

❌ PostGIS performance issues
   Clustering queries > 1000ms (target: < 300ms)
```

### What Copilot Will Do

**Phase 1-2 (60 min)**: Fix all API endpoints
- Diagnose database connectivity
- Fix middleware/CORS
- Add error handling
- **Output**: 6 patches (003-008)

**Phase 3 (30 min)**: Fix React components
- Audit useEffect hooks
- Add error boundaries
- Implement cleanup
- **Output**: 4 patches (010-013)

**Phase 4 (60 min)**: Enable MapView layers
- Configure all 5 layers
- Implement detailed rendering
- Add layer controls
- **Output**: 8 patches (015-022)

**Phase 5 (20 min)**: Fix network errors
- Resolve ERR_CONNECTION_RESET
- Fix static file serving
- **Output**: 4 patches (024-027)

**Phase 6 (30 min)**: Optimize PostGIS
- Add GiST indexes
- Optimize clustering algorithm
- Implement caching
- **Output**: 5 patches (028-032)

**Phase 7-8 (50 min)**: Testing & documentation
- Run all tests
- Validate performance
- Generate docs
- **Output**: README, ROLLBACK, TESTING, DEPLOYMENT guides

### Expected Results

```
✅ All 6 API endpoints → 200 OK (< 500ms)
✅ Zero ERR_CONNECTION_RESET errors
✅ Zero React infinite loop errors
✅ All 5 MapView layers rendering correctly
✅ PostGIS queries < 300ms
✅ All tests passing
✅ 30-40 patches generated
✅ Complete documentation
✅ Zero SAFE_MODE violations
✅ All policies passed
```

---

## 🛡️ Safety Features (SUPER-AGENT v3)

### SAFE_MODE Enforcement

```
┌─────────────────────────────────────────────┐
│ BeforeFileWrite Hook                        │
├─────────────────────────────────────────────┤
│ IF file_path starts with ".github/"        │
│   THEN allow (exit 0)                       │
│ ELSE                                        │
│   DENY and log to audit.log (exit 2)       │
│   Tell agent to generate patch instead     │
└─────────────────────────────────────────────┘
```

**Result**: Copilot **cannot** modify your application code directly. It can only:
- ✅ Generate patches under `.github/patches/`
- ✅ Update findings in `.github/findings.json`
- ✅ Update memory in `.github/agent-memory/`
- ✅ Write documentation in `.github/`

**You** must review and apply patches manually. This ensures:
- 🛡️ No accidental corruption
- 👀 Human review of all changes
- 📜 Complete audit trail
- ↩️ Easy rollback

### Policy Enforcement

Before any changes are finalized:

```yaml
# .github/policies/no-secrets.yaml
- Scans all patches for API keys, tokens, passwords
- Blocks commits if secrets detected

# .github/policies/dependency-allowlist.yaml
- Only MIT, Apache-2.0, BSD licenses allowed
- Rejects GPL, AGPL packages

# .github/policies/max-pr-size.yaml
- Max 500 lines changed, 20 files
- Exceptions for refactor/migration

# .github/policies/protected-files.yaml
- AGENTS.md, workflows require approval
- No direct edits allowed
```

### Audit Trail

Every decision logged to `.github/hooks/audit.log`:

```jsonl
{"timestamp":"2026-02-10T10:05:00Z","hook":"BeforeAgent","decision":"allow"}
{"timestamp":"2026-02-10T10:15:00Z","hook":"BeforeTool","decision":"allow","violations":[]}
{"timestamp":"2026-02-10T11:30:00Z","hook":"BeforeFileWrite","file":"app/api/health.ts","decision":"deny","reason":"SAFE_MODE"}
{"timestamp":"2026-02-10T11:31:00Z","hook":"BeforeFileWrite","file":".github/patches/003-api-fix.patch","decision":"allow"}
```

You can review **every** decision Copilot made.

---

## 📚 File Guide

### Primary Task File
**vscode-copilot-agent-task.md**
- What: Complete task specification
- Size: ~25KB
- Sections:
  - Agent mode protocol
  - 8-phase execution plan
  - Success criteria (34 checks)
  - SUPER-AGENT v3 integration
  - Hook/skill/policy usage
  - Error handling & recovery
  - Monitoring & observability
  - Final deliverables

### Usage Guide
**vscode-copilot-usage-guide.md**
- What: Comprehensive how-to guide
- Size: ~19KB
- Sections:
  - Quick start
  - Agent mode vs. chat mode
  - Framework overview
  - Command reference
  - Skills/hooks/policies explained
  - SAFE_MODE deep dive
  - Best practices
  - Troubleshooting
  - Example session transcript

### Quick Reference
**QUICK-REFERENCE-COPILOT.md**
- What: TL;DR command cheat sheet
- Size: ~8KB
- Sections:
  - 30-second start
  - Tool comparison (Code vs. Copilot)
  - Command cheat sheet
  - Task summary
  - Common issues
  - After completion steps

---

## ✅ Pre-Flight Checklist

Before starting, ensure:

- [ ] **VS Code installed** with GitHub Copilot extension
- [ ] **Copilot subscription active** (Pro or Business)
- [ ] **Project open in VS Code**
- [ ] **SUPER-AGENT v3 infrastructure exists**:
  - [ ] `.github/AGENTS.md` present
  - [ ] `.github/copilot-instructions.md` present
  - [ ] `.github/skills/` directory with 7 skills
  - [ ] `.github/hooks/` directory with 5 hooks
  - [ ] `.github/policies/` directory with 4 policies
- [ ] **Dependencies installed**:
  - [ ] Node.js (for hooks)
  - [ ] jq (for JSON parsing)
  - [ ] Git (for patch application)
- [ ] **Application running locally** (for testing)
- [ ] **Terminal windows ready** (for monitoring)

---

## 🚀 What to Expect

### Timeline
```
Hour 1: Infrastructure analysis + API Gateway fixes
Hour 2: React component fixes + MapView layer integration (partial)
Hour 3: MapView completion + Network fixes + PostGIS optimization
Hour 4: Testing + Documentation + Finalization
```

### Your Involvement
```
Minute 1-5: Initialize Copilot, paste task
Minute 5-10: Answer clarifying questions
Minute 10-180: Monitor progress, spot-check patches
Minute 180-200: Review deliverables, apply patches
Minute 200-210: Run verification, create PR
```

### Copilot's Output
```
.github/patches/
├── 001-execution-plan.md (analysis)
├── 002-api-diagnostics.json (diagnostic data)
├── 003-033-*.patch (30+ fix patches)
├── README.md (how to apply)
├── ROLLBACK.md (how to undo)
├── TESTING.md (how to test)
└── DEPLOYMENT.md (how to deploy)

.github/findings.json (15+ issues documented)
.github/agent-memory/session_memory.json (updated)
.github/hooks/audit.log (150+ decisions logged)
```

---

## 🎓 Learning Resources

### First Time Using Agent Mode?

**Start here**:
1. Read `QUICK-REFERENCE-COPILOT.md` (5 min)
2. Skim `vscode-copilot-usage-guide.md` "Quick Start" section (10 min)
3. Try initializing Copilot: `@workspace Load .github/AGENTS.md`
4. Ask it to explain: `@workspace Explain our SUPER-AGENT v3 framework`
5. Then paste the main task

### Familiar with Copilot Chat?

**Jump straight in**:
1. Open Copilot Chat (`Ctrl+Alt+I` / `Cmd+Alt+I`)
2. Paste: `@workspace Load .github/AGENTS.md framework`
3. Paste entire `vscode-copilot-agent-task.md` file
4. Monitor `.github/patches/` directory
5. Review and apply patches when complete

### Want to Understand the Framework?

**Read these in order**:
1. `.github/README.AGENT_ACTIONS.md` (SUPER-AGENT v3 overview)
2. `.github/AGENTS.md` (your project-specific instructions)
3. `.github/copilot-instructions.md` (Copilot-specific config)
4. `vscode-copilot-usage-guide.md` (how to use it all)

---

## 🆘 Troubleshooting

### "Copilot is modifying code directly"
**Fix**: Copilot is not respecting SAFE_MODE
```
@workspace STOP. Review .github/AGENTS.md SAFE_MODE section.
Only generate patches under .github/patches/
```

### "Skills not found"
**Fix**: Copilot can't see `.github/skills/`
```
@workspace Reload workspace
@workspace /loadFiles .github/skills/api-adapter/SKILL.md
@workspace List all available skills
```

### "Hooks failing"
**Fix**: Permissions or dependencies issue
```bash
chmod +x .github/hooks/*.js
cd .github/hooks && npm install
echo '{"test": true}' | node BeforeAgent.js  # Test
```

### "Patches not applying"
**Fix**: Code changed since patch generated
```
@workspace The patch conflicts. Regenerate based on current file state.
@terminal git diff  # Show changes
@terminal git apply --3way .github/patches/001-*.patch  # Try 3-way merge
```

### "Performance still slow"
**Fix**: Need additional optimization
```
@workspace PostGIS queries still > 300ms. Generate additional optimization patches.
@workspace Use api-adapter skill to profile query execution plans.
```

---

## 🎉 Success Criteria

Task is complete when:

```
✅ All 6 API endpoints returning 200 OK
✅ Response time < 500ms (p95)
✅ Zero "Maximum update depth exceeded" errors
✅ Zero ERR_CONNECTION_RESET errors
✅ All 5 MapView layers visible and interactive
✅ PostGIS clustering < 300ms (p95)
✅ Tile loading < 200ms
✅ All tests passing (backend + frontend)
✅ All policies passed (no violations)
✅ 30+ patches generated under .github/patches/
✅ Complete documentation (README, ROLLBACK, TESTING, DEPLOYMENT)
✅ Findings report complete
✅ Memory updated
✅ Audit log complete
✅ Zero SAFE_MODE violations
```

---

## 🏁 Ready to Start?

### Option 1: Just Do It (Recommended)
```bash
code .  # Open VS Code
# Ctrl+Alt+I / Cmd+Alt+I
@workspace Load .github/AGENTS.md framework
@workspace [paste vscode-copilot-agent-task.md]
```

### Option 2: Read First, Then Do
1. Read `QUICK-REFERENCE-COPILOT.md` (5 min)
2. Skim `vscode-copilot-usage-guide.md` (15 min)
3. Follow Option 1

### Option 3: Deep Dive, Then Do
1. Read `.github/README.AGENT_ACTIONS.md` (10 min)
2. Read `vscode-copilot-usage-guide.md` (30 min)
3. Read `vscode-copilot-agent-task.md` (20 min)
4. Follow Option 1

---

## 📞 Questions?

**About the task**: See `vscode-copilot-agent-task.md`  
**About using Copilot**: See `vscode-copilot-usage-guide.md`  
**Quick commands**: See `QUICK-REFERENCE-COPILOT.md`  
**About SUPER-AGENT v3**: See `.github/README.AGENT_ACTIONS.md`

---

**Good luck! 🚀**

You've got a robust framework, a comprehensive task spec, and Claude Opus 4.6 ready to help. The hardest part is just getting started.

**Next step**: Open VS Code and type `@workspace` in Copilot Chat.

---

**Generated by**: Claude Sonnet 4.5  
**For**: Cape Town GeoHub MapView Integration  
**Date**: 2026-02-10  
**Framework**: SUPER-AGENT v3 + VS Code GitHub Copilot + Claude Opus 4.6
