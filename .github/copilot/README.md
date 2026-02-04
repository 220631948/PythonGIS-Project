# Cape Town GeoHub Copilot Integration

This directory contains the configuration for custom GitHub Copilot agents, prompts, and instructions.

## Directory Structure

- `agents/`: Custom agent definitions (YAML) for specialized tasks (spatial, backend, frontend, testing, database, devops).
- `prompts/`: Reusable prompt templates for API design, components, GeoJSON/spatial, testing, and documentation.
- `instructions/`: Coding standards and patterns (TypeScript, Python, spatial, architecture, performance, security).
- `templates/`: Code scaffolding templates.
- `examples/`: Example interactions.
- `docs/`: Usage and contribution guides.

## Quick Start

See [docs/USAGE.md](docs/USAGE.md) for detailed instructions on how to use these agents and prompts.

## Spec Kit / VS Code Agents

The agent specs are stored as YAML for portability. If your tooling expects `.agent.md` or another schema, point it to this folder or convert the files using the same content. Spec Kit/VS Code Agents can read from `.github/copilot` when configured in workspace settings.
