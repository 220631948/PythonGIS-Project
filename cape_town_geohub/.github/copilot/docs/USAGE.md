# GitHub Copilot Custom Agents Usage Guide

## Introduction
This guide explains how to use the custom GitHub Copilot agents tailored for Cape Town GeoHub.

## Getting Started
1. Install GitHub Copilot extension
2. Enable agent specifications (if using Spec Kit extension) OR point Copilot to `.github/copilot` instructions
3. Configure workspace settings to reference `.github/copilot/instructions`

## Using Custom Agents
Invoke agents using `@` mentions if configured, or by copy-pasting the context/instructions from the agent file into your chat.

### Available Agents
- **Spatial Data Specialist**: `agents/spatial/geojson-expert.yml` - For GeoJSON and spatial data.
- **GeoPandas Expert**: `agents/spatial/geopandas-expert.yml` - For spatial analysis in Python.
- **FastAPI Expert**: `agents/backend/fastapi-expert.yml` - For backend API development.
- **React Expert**: `agents/frontend/react-expert.yml` - For frontend components.
- **Testing Agent**: `agents/testing/test-generator.yml` - For generating tests.

## Best Practices
- Start with specific context ("I am working on `app/services/new_service.py`...")
- Reference relevant files in the prompt
- Iterate on responses if the first one isn't perfect
- Validate generated code against project standards

## Common Workflows
- **New API Endpoint**: Use `prompts/api-design/create-endpoint.md`
- **React Component**: Use `prompts/component/create-feature-component.md`
- **Spatial Operation**: Use `prompts/spatial-analysis/buffer-operation.md`
