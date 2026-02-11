# 🚀 VS Code GitHub Copilot + SUPER-AGENT v3 - Quick Reference

## ⚡ 30-Second Start

```bash
# 1. Open your project in VS Code
cd /path/to/cape-town-geohub && code .

# 2. Open Copilot Chat (Ctrl+Alt+I / Cmd+Alt+I)

# 3. Initialize framework
@workspace Load .github/AGENTS.md framework, then I'll give you a task

# 4. Paste task
@workspace [paste vscode-copilot-agent-task.md]

# 5. Monitor
watch -n 2 'ls -lt .github/patches/ | head -10'
```

---

## 📋 Key Differences: Claude Code vs. VS Code Copilot

| Feature | Claude Code | VS Code GitHub Copilot |
|---------|-------------|------------------------|
| **Access** | Terminal CLI | VS Code extension |
| **Model** | Opus 4.6 direct | Opus 4.6 via Copilot API |
| **Context** | Entire codebase | @workspace context |
| **Agent Teams** | Yes (native) | No (single agent) |
| **Skills** | None (must build) | ✅ SUPER-AGENT v3 skills |
| **Hooks** | None | ✅ SUPER-AGENT v3 hooks |
| **SAFE_MODE** | None | ✅ Built-in via hooks |
| **Memory** | None | ✅ session/project/global |
| **Policy Enforcement** | None | ✅ YAML-based policies |
| **IDE Integration** | External | Native in VS Code |
| **File Preview** | None | Real-time in editor |
| **Debugging** | Terminal only | Integrated debugger |

---

## 🎯 When to Use Which Tool

### Use Claude Code When:
- ✅ You need agent teams (parallel execution)
- ✅ Task is simple/one-off (no framework overhead)
- ✅ You prefer terminal-based workflow
- ✅ No existing agent infrastructure

### Use VS Code Copilot When:
- ✅ You have SUPER-AGENT v3 framework set up
- ✅ You need SAFE_MODE enforcement
- ✅ You want to use custom skills
- ✅ You need policy compliance (security, licenses, etc.)
- ✅ You prefer IDE-integrated workflow
- ✅ You want persistent memory across tasks

---

## 🛠️ Your SUPER-AGENT v3 Infrastructure

### What You Have (From README.AGENT_ACTIONS.md)

```
✅ 7 Skills Ready
   • api-adapter: API diagnostics & SDK generation
   • dep-guardian: Dependency & security management
   • design-linter: UI consistency validation
   • ui-crawler: Browser automation & visual testing
   • refactor-strategist: Safe refactoring with rollback
   • accessibility-auditor: WCAG compliance checking
   • pr-reviewer: PR validation & security audit

✅ 5 Hooks Enforcing Safety
   • BeforeAgent: Initialize memory, load context
   • BeforeTool: Validate inputs, security checks
   • AfterTool: Run tests, update memory
   • BeforeFileWrite: SAFE_MODE enforcement
   • AfterExecution: Archive logs, generate summary

✅ 4 Policies as Code
   • no-secrets: Detect API keys, tokens, passwords
   • dependency-allowlist: MIT/Apache/BSD only
   • max-pr-size: 500 lines, 20 files limit
   • protected-files: AGENTS.md, workflows protected

✅ Memory System
   • session_memory.json: Current task state
   • project_memory.json: Project-wide learnings
   • global_agent_memory.json: Cross-project knowledge

✅ Verification Scripts
   • verify.sh: Full infrastructure validation
   • policy_check.js: Policy enforcement engine

✅ CI/CD Integration
   • agent-ci.yml: GitHub Actions workflow
```

---

## 💡 Key Concepts

### SAFE_MODE (Critical!)

```
┌────────────────────────────────────────────────┐
│ SAFE_MODE = true (DEFAULT)                    │
├────────────────────────────────────────────────┤
│ ✅ Allowed:                                    │
│   • Read ANY file                              │
│   • Write to .github/ ONLY                     │
│   • Run non-destructive commands               │
│   • Generate patches                           │
│                                                │
│ ❌ Blocked:                                    │
│   • Write to app/, frontend/, backend/, tests/ │
│   • Delete files                               │
│   • Force push                                 │
│   • Sudo commands                              │
└────────────────────────────────────────────────┘
```

**Why SAFE_MODE?**
- Prevents accidental code corruption
- Enforces human review via patches
- Maintains audit trail
- Enables rollback
- Complies with protected file policies

### Skills vs. Hooks vs. Policies

```
┌─────────────┬──────────────────────────────────────┐
│ Component   │ Purpose                              │
├─────────────┼──────────────────────────────────────┤
│ SKILLS      │ Reusable capabilities (what to do)   │
│             │ Example: api-adapter diagnoses APIs  │
├─────────────┼──────────────────────────────────────┤
│ HOOKS       │ Lifecycle enforcement (when to act)  │
│             │ Example: BeforeFileWrite blocks app/ │
├─────────────┼──────────────────────────────────────┤
│ POLICIES    │ Rules as code (what's allowed)       │
│             │ Example: no-secrets detects tokens   │
└─────────────┴──────────────────────────────────────┘
```

### Memory System

```
session_memory.json
├─ Current task ID
├─ Progress (0.0 - 1.0)
├─ Patches generated
├─ Phase (analysis, execution, testing)
└─ Findings count

project_memory.json
├─ Common patterns learned
├─ API endpoint mappings
├─ Component dependency graph
└─ Performance baselines

global_agent_memory.json
├─ Cross-project best practices
├─ Reusable code patterns
└─ Security rules
```

---

## 📊 Command Cheat Sheet

### Initialization

```bash
# Load framework
@workspace Load .github/AGENTS.md framework

# Initialize with settings
@workspace Initialize agent with:
- SAFE_MODE=true
- trace_id=trace-mapview-fix-001
- max_iterations=50
```

### File Operations

```bash
# Load specific files
@workspace /loadFiles .github/AGENTS.md
@workspace /loadFiles app/api/health.ts

# Search codebase
@workspace /search "ERR_CONNECTION_RESET"
@workspace /search "useEffect" --include="*.tsx"

# Explain architecture
@workspace /explain .github/agent-manifest.json
```

### Skill Invocation

```bash
# Use a skill
@workspace /invoke-skill api-adapter diagnose \
  --endpoints="/api/health,/api/data-status/health"

# Chain skills
@workspace Use api-adapter to diagnose, then 
refactor-strategist to fix, then pr-reviewer to validate
```

### Hook Execution

```bash
# Manual hook testing
@terminal echo '{"test": true}' | node .github/hooks/BeforeAgent.js

# View audit log
@terminal cat .github/hooks/audit.log | jq

# Check last 10 hook decisions
@terminal tail -10 .github/hooks/audit.log | jq
```

### Policy Checks

```bash
# Run all policy checks
@terminal node .github/scripts/policy_check.js

# Check specific policy
@terminal node .github/scripts/policy_check.js \
  --policy=no-secrets \
  --path=.github/patches/

# Verbose output
@terminal node .github/scripts/policy_check.js --verbose
```

### Verification

```bash
# Quick verification
@terminal bash .github/scripts/verify.sh --quick

# Full verification
@terminal bash .github/scripts/verify.sh --full

# Only infrastructure
@terminal bash .github/scripts/verify.sh --infra-only
```

### Memory Operations

```bash
# View session memory
@workspace Show .github/agent-memory/session_memory.json

# View findings
@workspace Show .github/findings.json summary

# Update memory (agent does this automatically)
# Manual update (advanced):
@terminal jq '.current_task.progress = 0.75' \
  .github/agent-memory/session_memory.json > tmp.json && \
  mv tmp.json .github/agent-memory/session_memory.json
```

### Patch Management

```bash
# List patches
@terminal ls -lth .github/patches/

# View patch
@terminal cat .github/patches/003-api-health-fix.patch

# Check if patch applies cleanly
@terminal git apply --check .github/patches/003-api-health-fix.patch

# Apply patch
@terminal git apply .github/patches/003-api-health-fix.patch

# Revert patch (if applied)
@terminal git apply -R .github/patches/003-api-health-fix.patch
```

---

## 🎯 Your Specific Task: MapView Integration

### Problem Summary

```
❌ 6 API endpoints returning 500 errors
❌ 30+ ERR_CONNECTION_RESET errors
❌ React infinite loop (Maximum update depth exceeded)
❌ MapView layers not rendering
❌ PostGIS clustering not working
```

### Solution Approach (vscode-copilot-agent-task.md)

```
Phase 1: Analysis (15 min)
  → Diagnose root causes
  → Generate execution plan

Phase 2: API Gateway Fixes (45 min)
  → Fix 6 endpoints
  → Generate 6 patches

Phase 3: React Fixes (30 min)
  → Fix infinite loops
  → Add error boundaries
  → Generate 4 patches

Phase 4: MapView Integration (60 min)
  → Enable all 5 layers
  → Configure rendering
  → Generate 8 patches

Phase 5: Network Fixes (20 min)
  → Resolve connection errors
  → Generate 4 patches

Phase 6: PostGIS Optimization (30 min)
  → Optimize clustering
  → Generate 5 patches

Phase 7: Testing (30 min)
  → Run all tests
  → Validate performance

Phase 8: Documentation (20 min)
  → Generate docs
  → Update memory
```

### Expected Deliverables

```
.github/patches/
├── 001-execution-plan.md
├── 002-api-diagnostics.json
├── 003-008-*.patch (API fixes)
├── 010-013-*.patch (React fixes)
├── 015-022-*.patch (MapView layers)
├── 024-027-*.patch (Network fixes)
├── 028-032-*.patch (PostGIS optimization)
├── README.md (patch guide)
├── ROLLBACK.md (rollback instructions)
├── TESTING.md (test procedures)
└── DEPLOYMENT.md (deployment checklist)

.github/findings.json (updated with all issues)
.github/agent-memory/session_memory.json (final state)
.github/hooks/audit.log (complete audit trail)
```

---

## ✅ Success Checklist

Before considering task complete:

```
API Gateway
[ ] All 6 endpoints → 200 OK
[ ] Response time < 500ms

React Components
[ ] Zero infinite loop errors
[ ] Error boundaries in place
[ ] Loading states implemented

MapView
[ ] All 5 layers visible
[ ] Clustering working
[ ] Tile load < 200ms

Network
[ ] Zero ERR_CONNECTION_RESET
[ ] All resources loading

Performance
[ ] PostGIS queries < 300ms
[ ] Page load < 3s

Code Quality
[ ] All patches in .github/patches/
[ ] No SAFE_MODE violations
[ ] All policies passed
[ ] All tests passing

Documentation
[ ] README complete
[ ] ROLLBACK instructions
[ ] TESTING procedures
[ ] DEPLOYMENT checklist
```

---

## 🚨 Common Issues & Solutions

### "Agent not following SAFE_MODE"

```
Problem: Agent tries to edit app/api/health.ts

Solution:
@workspace STOP. Review .github/AGENTS.md SAFE_MODE constraints.
Only generate patches under .github/patches/
```

### "Skills not found"

```
Problem: api-adapter skill not found

Solution:
@workspace Reload workspace and verify .github/skills/ exists
@workspace /loadFiles .github/skills/api-adapter/SKILL.md
```

### "Hooks failing"

```
Problem: BeforeAgent.js returns exit code 1

Solution:
@terminal chmod +x .github/hooks/*.js
@terminal node .github/hooks/BeforeAgent.js  # Test manually
```

### "Patches not applying"

```
Problem: git apply fails with conflicts

Solution:
@workspace Regenerate patch based on current file state
@terminal git diff  # Check what changed
@terminal git apply --3way .github/patches/001-*.patch  # 3-way merge
```

### "Performance still slow"

```
Problem: PostGIS queries > 300ms

Solution:
@workspace Use api-adapter skill to profile queries
@workspace Generate additional optimization patches
@terminal EXPLAIN ANALYZE <query>  # Show query plan
```

---

## 📞 Getting Help

### In VS Code Copilot Chat

```
@workspace I'm stuck on [specific issue]. Can you:
1. Review .github/hooks/audit.log for errors
2. Check .github/findings.json for related issues
3. Suggest next steps
```

### Review Framework Documentation

```
@workspace /explain .github/AGENTS.md section on [topic]
@workspace Show examples from .github/skills/api-adapter/
```

### Check Logs

```
@terminal cat .github/hooks/audit.log | grep "deny"
@terminal cat .github/findings.json | jq '.findings[] | select(.severity=="high")'
```

---

## 🎉 After Task Completion

### 1. Review Generated Artifacts

```bash
# List all patches
ls -lh .github/patches/

# Read summary
cat .github/patches/README.md

# Check findings
cat .github/findings.json | jq .summary
```

### 2. Apply Patches

```bash
# One by one (recommended)
git apply .github/patches/003-api-health-fix.patch
npm test  # Verify
git commit -am "fix: API health endpoint"

# Or all at once (with caution)
cat .github/patches/*.patch | git apply
```

### 3. Run Verification

```bash
bash .github/scripts/verify.sh --full
npm run dev
curl http://localhost:5174/api/health
```

### 4. Create PR

```bash
git checkout -b fix/mapview-integration
git add .github/patches/
git commit -m "feat: MapView integration fixes

Generated by SUPER-AGENT v3
Trace: trace-mapview-fix-001"

gh pr create --title "Fix: MapView Integration" \
  --body-file .github/patches/README.md
```

---

## 🔗 Quick Links

**Your Framework**
- `.github/AGENTS.md` - Main instructions
- `.github/copilot-instructions.md` - Copilot config
- `.github/README.AGENT_ACTIONS.md` - SUPER-AGENT v3 overview

**Task Files**
- `vscode-copilot-agent-task.md` - Your MapView task spec
- `vscode-copilot-usage-guide.md` - Full usage guide

**Verification**
- `.github/scripts/verify.sh` - Infrastructure validator
- `.github/scripts/policy_check.js` - Policy enforcer

**Logs & Reports**
- `.github/hooks/audit.log` - Hook decisions (JSONL)
- `.github/findings.json` - Issues found
- `.github/agent-memory/` - Memory files

---

**Ready to start?**

```bash
# Open VS Code
code .

# Start Copilot Chat
Ctrl+Alt+I (Windows/Linux) or Cmd+Alt+I (Mac)

# Initialize
@workspace Load .github/AGENTS.md framework

# Go!
@workspace [paste vscode-copilot-agent-task.md]
```

**Good luck! 🚀**
