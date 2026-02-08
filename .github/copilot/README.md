# Cape Town GeoHub Copilot Integration

This directory contains the configuration for custom GitHub Copilot agents, prompts, and instructions.

## Directory Structure

- `../agents/`: Custom agent definitions (`.agent.md`) for specialized tasks (spatial, backend, frontend, testing, database, devops).
- `prompts/`: Reusable prompt templates for API design, components, GeoJSON/spatial, testing, and documentation.
- `instructions/`: Coding standards and patterns (TypeScript, Python, spatial, architecture, performance, security).
- `templates/`: Code scaffolding templates.
- `examples/`: Example interactions.
- `docs/`: Usage and contribution guides.

## Quick Start

See [docs/USAGE.md](docs/USAGE.md) for detailed instructions on how to use these agents and prompts.

## Spec Kit / VS Code Agents

Agent specs live in `.github/agents/*.agent.md`. If your tooling expects YAML, convert those files or point your agent tooling at `.github/agents`. Spec Kit/VS Code Agents can still read `.github/copilot` for prompts and instruction fragments when configured in workspace settings.
