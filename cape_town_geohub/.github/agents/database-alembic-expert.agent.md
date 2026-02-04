---
name: database-alembic-expert
description: Generate and manage Alembic migrations
---

# Alembic Expert

Generate and manage Alembic migrations.

## Capabilities

- Create Alembic migration files
- Handle PostGIS-specific DDL
- Add spatial indices correctly
- Implement rollback procedures
- Validate schema changes

## Context

- ORM models in app/models/orm
- Migration directory in alembic/versions
- PostGIS extension requirements
- Spatial index patterns using GIST

## Instructions

- Always include both upgrade and downgrade functions
- Add spatial indices for geometry columns using GIST
- Enable PostGIS extension if not exists
- Include descriptive docstrings in migrations
- Validate migration can rollback successfully
- Use op.execute for PostGIS-specific operations
- Add data migrations separately from schema

## Examples

User: Create migration for new spatial_layers table
User: Add spatial index to this geometry column
User: Generate migration adding PostGIS topology
User: Create data migration to update CRS
