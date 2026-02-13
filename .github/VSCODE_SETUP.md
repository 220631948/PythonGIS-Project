# VS Code AI Tooling Setup Guide

This guide covers setting up GitHub Copilot, Claude, and Gemini AI tools in VS Code for the Cape Town GeoHub project.

## Prerequisites

- VS Code or VS Code Insiders installed
- Git configured
- Node.js 18+ (for some extensions)
- Active subscriptions/API keys for AI services

## Extension Installation

### 1. GitHub Copilot

**Install via VS Code Marketplace:**
```bash
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
```

**Or manually:**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "GitHub Copilot"
4. Click Install on both:
   - GitHub Copilot (code completions)
   - GitHub Copilot Chat (chat interface)

**Authentication:**
1. Click the Copilot icon in the status bar
2. Sign in with your GitHub account
3. Authorize the Copilot extension

**Configuration:**
```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": true
  }
}
```

### 2. Claude Code (via Claude Agent SDK)

**Install via VS Code Marketplace:**
```bash
code --install-extension anthropics.claude-code
```

**Or manually:**
1. Open Extensions
2. Search for "Claude Code"
3. Install the Anthropic Claude extension

**Authentication:**
1. Get API key from https://console.anthropic.com
2. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Run "Claude: Set API Key"
4. Paste your API key

**Configuration:**
```json
{
  "claude.apiKey": "your-api-key-here",
  "claude.model": "claude-sonnet-4",
  "claude.maxTokens": 8000
}
```

### 3. Gemini CLI SDK

**Install Gemini CLI:**
```bash
npm install -g @google/generative-ai
```

**VS Code Extension (if available):**
```bash
code --install-extension google.gemini-code
```

**Authentication:**
1. Get API key from https://makersuite.google.com/app/apikey
2. Set environment variable:
```bash
export GEMINI_API_KEY="your-api-key"
```

**Add to your shell profile (~/.bashrc or ~/.zshrc):**
```bash
echo 'export GEMINI_API_KEY="your-api-key"' >> ~/.bashrc
source ~/.bashrc
```

## Ralph Wiggum CLI Integration

Ralph Wiggum is an autonomous AI coding loop that works with multiple AI agents. Choose the implementation that matches your preferred tool:

### Option 1: Ralph with Cursor CLI (Recommended)

**Prerequisites:**
```bash
# Install cursor-agent CLI
curl https://cursor.com/install -fsS | bash

# Install gum (optional, for better UI)
brew install gum  # macOS
sudo apt install gum  # Ubuntu/Debian
```

**Install Ralph:**
```bash
cd /home/mr/PycharmProjects/PythonGIS\ Project
curl -fsSL https://raw.githubusercontent.com/agrimsingh/ralph-wiggum-cursor/main/install.sh | bash
```

This creates:
- `.cursor/ralph-scripts/` - All Ralph scripts
- `.ralph/` - State files and logs

### Option 2: Ralph with Copilot CLI

```bash
# Install GitHub Copilot CLI
npm i -g @github/copilot

# Clone Ralph
git clone https://github.com/soderlind/ralph ~/ralph-copilot
cd /home/mr/PycharmProjects/PythonGIS\ Project
ln -s ~/ralph-copilot/ralph.sh ./ralph.sh
```

### Option 3: Ralph with Gemini CLI

```bash
# Install Ralph Gemini Extension
git clone https://github.com/AsyncFuncAI/ralph-wiggum-extension ~/ralph-gemini
cd /home/mr/PycharmProjects/PythonGIS\ Project
ln -s ~/ralph-gemini/ralph-gemini.sh ./ralph-gemini.sh
```

## Ralph Configuration

### 1. Create Task Definition

Create `RALPH_TASK.md` in project root:
```markdown
---
task: Cape Town GeoHub Development
test_command: "pytest tests/ && npm test --prefix frontend"
---

# Task: Cape Town GeoHub

## Success Criteria
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Docker builds successfully
- [ ] No TypeScript errors
- [ ] Code follows project conventions

## Implementation Notes
- Use FastAPI patterns from existing endpoints
- Follow React TypeScript conventions
- Maintain PostGIS spatial query patterns
```

### 2. Configure Ralph Settings

Create `ralph.yml`:
```yaml
# Ralph Configuration for Cape Town GeoHub
model: claude-sonnet-4  # or gpt-4, gemini-1.5-pro
max_iterations: 20
test_command: pytest tests/ && npm test --prefix frontend

# Permission profiles
profiles:
  safe:
    - write
    - shell:git:*
    - shell:npm:*
    - shell:pytest:*

  dev:
    - write
    - shell:*

# Context management
context:
  max_tokens: 80000
  warning_threshold: 70000
  rotation_strategy: fresh

# Monitoring
logging:
  activity: .ralph/activity.log
  progress: .ralph/progress.md
  errors: .ralph/errors.log
```

## Usage Examples

### Single Iteration with Ralph
```bash
# Cursor-based
./.cursor/ralph-scripts/ralph-once.sh

# Copilot-based
./ralph.sh --prompt RALPH_TASK.md --allow-profile safe
```

### Multiple Iterations
```bash
# Run up to 10 iterations
./.cursor/ralph-scripts/ralph-loop.sh --iterations 10

# With specific model
./ralph.sh --model claude-opus-4 --iterations 20
```

### Parallel Execution
```bash
# Run 3 concurrent agents
./.cursor/ralph-scripts/ralph-loop.sh --parallel --max-parallel 3

# Create PR when done
./ralph-loop.sh --parallel --pr
```

## Monitoring Ralph Execution

Watch logs in real-time:
```bash
# Activity log
tail -f .ralph/activity.log

# Progress
watch -n 2 cat .ralph/progress.md

# Errors
tail -f .ralph/errors.log
```

## Recommended VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  // Copilot
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "python": true,
    "typescript": true,
    "typescriptreact": true
  },

  // Claude
  "claude.model": "claude-sonnet-4",
  "claude.maxTokens": 8000,

  // Editor
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },

  // Python
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",

  // TypeScript
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Troubleshooting

### Copilot Not Working
```bash
# Re-authenticate
gh auth login
code --install-extension GitHub.copilot
```

### Claude API Issues
```bash
# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Ralph Script Permissions
```bash
# Make scripts executable
chmod +x .cursor/ralph-scripts/*.sh
chmod +x ralph.sh
```

### Context Window Issues
Ralph automatically manages context by rotating to fresh agents at 80k tokens. If you see warnings:
- Check `.ralph/activity.log` for token usage
- Reduce iteration count
- Use parallel execution with smaller task groups

## Best Practices

1. **Use Ralph for repetitive tasks**: Let it handle test fixes, refactoring, documentation
2. **Define clear success criteria**: Specific, testable conditions in RALPH_TASK.md
3. **Monitor logs**: Keep an eye on `.ralph/` directory for issues
4. **Start with safe profile**: Use `--allow-profile safe` before `dev`
5. **Use parallel execution wisely**: 3-5 agents max for most tasks
6. **Commit frequently**: Ralph works best with version control
7. **Review changes**: Always review Ralph's commits before merging

## Additional Resources

- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Claude API Docs](https://docs.anthropic.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Ralph Wiggum Cursor](https://github.com/agrimsingh/ralph-wiggum-cursor)
- [Ralph Copilot](https://github.com/soderlind/ralph)

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Add `.ralph/` to `.gitignore` (contains logs)
- Review Ralph's changes before pushing to production
- Use `safe` profile for production-related tasks
