# Agent Memory Directory

This directory contains structured memory files that enable SUPER-AGENT v3 to maintain context across sessions and make informed decisions.

## Memory Files

### `session_memory.json`
- **Scope**: Current session only (ephemeral)
- **Purpose**: Track decisions, actions, and findings during the active agent session
- **Retention**: Cleared at session end unless explicitly persisted
- **Examples**: Current task progress, temporary state, session-specific findings

### `project_memory.json`
- **Scope**: Cape Town GeoHub repository
- **Purpose**: Persist architectural decisions, conventions, and project-specific knowledge
- **Retention**: Permanent (until TTL expires or explicitly removed)
- **Examples**: CRS conventions, module patterns, quality gates, data sources

### `global_agent_memory.json`
- **Scope**: Cross-project (user-approved only)
- **Purpose**: Store long-term patterns and best practices that apply across multiple projects
- **Retention**: Long-term (730+ days TTL)
- **Examples**: Security patterns, SAFE_MODE protocols, general best practices

## Memory Entry Schema

Each memory entry follows this structure:

```json
{
  "id": "unique-identifier",
  "category": "architecture|decision|finding",
  "source": "where this knowledge came from",
  "timestamp": "ISO 8601 timestamp",
  "summary": "short text (1-2 sentences)",
  "detail": "longer text with full context",
  "ttl_days": 90
}
```

## Categories

- **architecture**: System structure, patterns, conventions
- **decision**: Explicit decisions made (ADRs, choices)
- **finding**: Discovered issues, insights, or observations

## Update Triggers

Memory is updated when:
- Decision is committed
- Architecture changes
- Test fails
- New ADR created
- Agent mode changes

## Retrieval

To retrieve memories, search by:
- Category
- Source
- Keywords in summary/detail
- Timestamp range

## Maintenance

- Old entries automatically expire based on TTL
- High-value entries can have TTL extended
- Duplicate or obsolete entries should be manually removed
- Regular review recommended every 90 days
