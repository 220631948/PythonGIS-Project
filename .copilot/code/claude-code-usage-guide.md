# Claude Code with Opus 4.6 - Quick Usage Guide

## 🚀 Starting Your Task

### Basic Command Structure
```bash
# Navigate to your project directory
cd /path/to/your/project

# Start Claude Code with Opus 4.6
claude code --model claude-opus-4-6
```

### Using the Prepared Prompt
```bash
# Copy the prompt to your clipboard, then in Claude Code:
# Paste the entire contents of claude-code-mapview-task.md

# Or reference it directly:
claude code --model claude-opus-4-6 --file claude-code-mapview-task.md
```

---

## 🧠 Opus 4.6 Specific Features

### 1. Adaptive Thinking (Recommended)
```bash
# Opus 4.6 automatically uses adaptive thinking
# No need to manually configure it
# It will think more deeply on complex problems automatically
```

### 2. Effort Levels
When Claude asks about complexity, you can specify:
- **low**: Quick, straightforward tasks
- **medium**: Standard complexity (default)
- **high**: Complex debugging/architecture work ⭐ **Use this for your MapView task**
- **max**: Extremely difficult problems

### 3. Agent Teams (Research Preview)
```bash
# To enable agent teams in Claude Code:
claude code --model claude-opus-4-6 --agent-teams

# This allows multiple specialized agents to work in parallel:
# - Agent 1: Backend/API fixes
# - Agent 2: Frontend/React
# - Agent 3: MapView integration
# - Agent 4: Testing/QA
```

---

## 📝 Best Practices for Your Task

### 1. Initial Prompt
Copy-paste the entire `claude-code-mapview-task.md` file. This gives Claude:
- Full context of the problem
- Clear success criteria
- Structured debugging approach
- Performance targets

### 2. Let Claude Lead
After providing the initial prompt:
```
You: [Paste the full task prompt]
Claude: [Starts analysis and planning]
You: [Answer any clarifying questions]
Claude: [Executes fixes with agent teams]
```

### 3. Progressive Disclosure
If Claude gets stuck, provide additional context:
```
"Here are the database connection logs..."
"The PostGIS version is X.X.X"
"Here's the relevant copilot-instructions.md content..."
```

### 4. Monitor Progress
Claude will show you:
- Which agent is working on what
- File changes being made
- Test results
- Progress updates

---

## 🎯 Expected Workflow

### Phase 1: Analysis (5-10 min)
```
Claude examines:
- Your codebase structure
- API endpoint configurations
- React component dependencies
- PostGIS connection settings
- Error patterns
```

### Phase 2: Planning (5 min)
```
Claude presents:
- Root cause analysis
- Proposed fixes
- Agent team assignments (if enabled)
- Timeline estimate
```

### Phase 3: Execution (1-2 hours)
```
Agents work in parallel:
- API fixes
- React refactoring
- MapView configuration
- Testing
```

### Phase 4: Validation (15-30 min)
```
Claude runs:
- Unit tests
- Integration tests
- Performance checks
- Final validation
```

---

## 🛠️ Troubleshooting Claude Code

### If Claude Gets Stuck
```bash
# 1. Check if it needs clarification
# 2. Provide additional context from your #codebase
# 3. Use #websearch to get latest docs
# 4. Switch agents if needed (#switchAgent)
```

### If You Need to Restart
```bash
# Save Claude's progress so far
# Then restart with context:
claude code --model claude-opus-4-6 --resume-from <session-id>
```

### If APIs Are Still Failing
```bash
# Ask Claude to:
1. Show you the exact API gateway logs
2. Test each endpoint individually
3. Validate PostGIS connection directly
4. Check environment variables
```

---

## 📊 Monitoring Success

### Real-time Checks
While Claude works, you can verify in your terminal:

```bash
# Check API health
curl http://localhost:5174/api/health

# Monitor console errors
# Open browser DevTools and watch the Console

# Check PostGIS
psql -U your_user -d your_db -c "SELECT PostGIS_version();"

# View app
open http://localhost:5174
```

### Success Indicators
✅ All API endpoints return 200
✅ Browser console shows no errors
✅ MapView renders with all layers visible
✅ No ERR_CONNECTION_RESET errors
✅ Dashboard loads successfully

---

## 💡 Pro Tips

### 1. Use the 1M Context Window
Opus 4.6 has a massive context window. Don't hesitate to:
- Share entire file contents
- Provide detailed logs
- Include multiple error traces

### 2. Leverage Web Search
Reference these in your prompt or ask Claude to search:
- `#websearch PostGIS clustering best practices 2026`
- `#websearch React useEffect infinite loop fixes`
- `#websearch API Gateway 500 error debugging`

### 3. Reference Files Explicitly
```bash
#file:App.tsx
#file:copilot-instructions.md
#file:api/health.ts
```

### 4. Trust the Adaptive Thinking
Opus 4.6 knows when to think deeply. For your complex MapView + API + PostGIS task, it will automatically:
- Spend more time on analysis
- Consider multiple solutions
- Review its own code
- Validate before submitting

---

## 🎓 Key Differences from Opus 4.5

| Feature | Opus 4.5 | Opus 4.6 |
|---------|----------|----------|
| **Context Window** | 200K tokens | 1M tokens |
| **Thinking Mode** | Manual budget | Adaptive (automatic) |
| **Agent Teams** | ❌ Not available | ✅ Research preview |
| **Max Output** | 64K tokens | 128K tokens |
| **Context Compaction** | ❌ Manual management | ✅ Automatic |
| **Effort Levels** | ❌ N/A | ✅ 4 levels (low/med/high/max) |

---

## 🚨 Important Notes

### Agent Teams (Research Preview)
- Currently in beta
- May not be available in all regions
- Request access via Claude Code settings if needed

### Performance Expectations
With Opus 4.6 + Agent Teams:
- **Faster** parallel execution
- **Better** code quality first-try
- **Deeper** debugging capabilities
- **More** comprehensive testing

### Cost Considerations
Opus 4.6 pricing: $5/$25 per MTok (input/output)
- Adaptive thinking = higher token usage on complex tasks
- Agent teams = parallel processing (still counted)
- 1M context = premium pricing above 200K tokens

---

## 📞 Getting Help

### If Something Isn't Working
1. **Check Claude Code version**: `claude code --version`
2. **Update if needed**: `npm install -g @anthropic-ai/claude-code@latest`
3. **Verify model access**: Opus 4.6 requires appropriate API tier
4. **Review logs**: `~/.claude-code/logs/`

### Resources
- **Claude Code Docs**: https://docs.claude.com/claude-code
- **API Docs**: https://docs.anthropic.com/en/docs/about-claude/models
- **Community**: https://discord.gg/anthropic

---

## ✨ Final Checklist Before Starting

- [ ] Claude Code installed and updated
- [ ] In correct project directory
- [ ] `claude-code-mapview-task.md` file ready
- [ ] Opus 4.6 model access confirmed
- [ ] Agent teams enabled (if available)
- [ ] Browser DevTools open for monitoring
- [ ] Database/API running locally
- [ ] Ready to provide additional context if needed

---

**Now you're ready!** 🚀

Start Claude Code with:
```bash
claude code --model claude-opus-4-6 --agent-teams
```

Then paste the contents of `claude-code-mapview-task.md` and let Claude work its magic!
