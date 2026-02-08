# Contributing to Copilot Integration

## Adding New Agents

1. Identify gap in existing agents (e.g., "We need a Docker expert")
2. Create agent specification in `.github/agents/agent-name.agent.md`
3. Define capabilities, context, and instructions
4. Add example interactions
5. Test with real scenarios
6. Document in `USAGE.md`

## Creating Prompts

1. Identify common pattern (e.g., "We often need to generate CSV exporters")
2. Extract reusable template from successful prompts
3. Add context requirements
4. Provide usage examples
5. Save to `prompts/category/prompt-name.md`

   - Categories: `api-design`, `component`, `geojson`, `spatial-analysis`, `testing`, `documentation`

## Updating Instructions

1. Propose guideline changes to the team
2. Update relevant markdown in `instructions/` (coding-standards, spatial-patterns, architecture, performance, security)
3. Update relevant agents to reference new instructions
4. Document in changelog
