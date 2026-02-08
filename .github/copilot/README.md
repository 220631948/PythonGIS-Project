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

### Spec Kit support

This repository includes a minimal Spec Kit scaffold in `.specify/` (see `.specify/spec.md`, `.specify/plan.md`, `.specify/tasks/`) and prompt templates in `.github/prompts/` to support spec-driven authoring.

A lightweight CI job (`.github/workflows/spec-check.yml`) verifies the presence of the spec artefacts on PRs. To get started:

1. Install the Specify CLI — see [Spec Kit](https://github.com/github/spec-kit) for installation options.
2. Run `specify init .` to bootstrap additional templates, or update `.specify/spec.md` and `.specify/plan.md` directly.
3. Use the prompts under `.github/prompts/` to generate plans and tasks for coding agents (Copilot, Claude, etc.).

If you'd like help installing or integrating the Specify CLI into CI, file an issue or add a task under `.specify/tasks/`.
