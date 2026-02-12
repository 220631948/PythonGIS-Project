## Plan: Restructure to single project root

TL;DR: Convert the repo from a double-root (outer “PythonGIS Project” with inner “cape_town_geohub/”) to a single root located where code currently lives (the inner tree). Preserve history via moves, merge duplicate configs (git/docker/compose/requirements/docs), update paths in workflows/Docker/scripts, and validate builds/tests. Git root is already at outer level; there is no nested .git. Outer root has its own .github (deploy-only) and top-level app/ alongside the main cape_town_geohub tree.

**Steps**

1. Baseline + safety
   - Record findings in restructure-analysis.txt at repo root (duplicates: .gitignore/.dockerignore; Dockerfile(s); compose.yaml vs docker-compose.prod.yml; README/ETHICS/CONTRIBUTING/CHANGELOG; requirements-pinned.txt vs requirements.txt; dual .github trees; .vscode at both levels; nested .env/.env.example).
   - Git status, confirm branch (fix/security/npm-audit-frontend-2026-02-04), create safety branch (restructure-backup) and archive tarball of current repo.

2. Decide target root + move strategy
   - Target root = current outer git root; content source = cape_town_geohub/.
   - Determine fate of outer root app/ (appears stray vs main app/ under cape_town_geohub/): inspect and decide keep/move/delete; note in analysis.

3. Clean outer root cruft pre-move
   - Remove caches: .pytest_cache/, **pycache**, .output.txt, node_modules/ at root if not needed, .agent-memory (empty), .junie/ if ignorable.
   - Keep .github until merged; keep outer Dockerfile/compose until compared.

4. Merge duplicate configs before moves
   - .gitignore: merge outer and inner; ensure ignores for postgres_data/, logs/, .venv/, node_modules/, .pytest_cache/, **pycache**, \*.log, .env, .agent-memory.
   - .dockerignore: merge similarly.
   - docker-compose: compare outer compose.yaml vs inner docker-compose.prod.yml/docker-compose.yml.bak; create single docker-compose.yml (+ docker-compose.prod.yml if needed) with updated paths (post-move paths will be root-relative).
   - Requirements: compare outer requirements-pinned.txt and inner requirements.txt; decide on single requirements.txt (and optional requirements-pinned.txt) with reconciled versions.
   - README/CONTRIBUTING/ETHICS/CHANGELOG/TEST_REPORT/OFFLINE_SETUP/TYPESCRIPT_MIGRATION: diff outer vs inner; keep canonical versions in root/docs as needed.
   - Workflows: reconcile outer .github/workflows/deploy.yml with inner .github/workflows/ci.yml + deploy.yml; decide final set in root .github/.

5. Relocate content up from cape_town_geohub/
   - Copy inner tree (including dotfiles: .env.example, .gitignore, .dockerignore, .pre-commit-config.yaml, pytest.ini, Makefile, alembic.ini) to a temp dir, then move into repo root.
   - Remove empty cape_town_geohub/ directory once verified.
   - Ensure data/, logs/, postgres_data/ remain but are git-ignored.

6. Reconcile tooling/config after move
   - Update Dockerfile(s) COPY/WORKDIR contexts from cape_town_geohub/… to ./…
   - Update docker-compose volume/context paths from ./cape_town_geohub/... to ./...
   - Update alembic/env.py path references if any.
   - Update scripts in scripts/ for path assumptions (cd commands, relative paths).
   - Update pytest.ini testpaths to new layout.
   - Ensure .vscode merged or pick canonical settings.
   - Remove duplicate/obsolete files (numpy_version.txt, docker-compose.yml.bak, Dockerfile.backup if unnecessary).

7. Unify .github
   - Move inner .github content to root .github, merging workflows (ci.yml, deploy.yml), copilot-instructions.md, agents/, copilot/.
   - Remove outer .github duplicates after merge; ensure workflow paths reflect new root (no cape_town_geohub prefixes).

8. Documentation updates
   - Update README.md with new tree (no nested cape_town_geohub).
   - Fix doc links to docs/, scripts/, app/, frontend/.
   - Add docs/RESTRUCTURE_MIGRATION.md summarizing breaking changes and migration steps.

9. Verification
   - find . -type l -! -exec test -e {} \; -print (ensure no broken symlinks).
   - grep -r "cape_town_geohub" . (ensure no stale path refs in code/workflows/scripts).
   - Python import sanity: python -c "from app.main import app".
   - Backend tests: pytest tests/ --maxfail=1
   - Frontend: (cd frontend && npm install && npm run lint && npm run build)
   - Docker: docker-compose build && docker-compose up -d (check logs).
   - Alembic: alembic current (from repo root).
   - Optional: scripts/validate_structure.sh per provided template.

10. Git hygiene and PR
    - git status to confirm moves detected (renames).
    - git add -A; commit with refactor(structure)! message noting breaking restructure and migration guide.
    - Push restructure branch; open PR describing path updates, merged configs, and validation steps.

**Verification**

- Directory root contains app/, frontend/, tests/, scripts/, docs/, alembic/, data/, static/, .github/, Makefile, pytest.ini, requirements.txt, compose.yaml, Dockerfile, .gitignore/.dockerignore; no cape_town_geohub/ dir.
- No code/workflow references to cape_town_geohub paths.
- python -c "from app.main import app" succeeds.
- pytest tests/ passes.
- npm run build (frontend) passes.
- docker-compose build/up works from root.
- Alembic commands run from root.
- git status clean aside from intended changes.

**Decisions**

- Single project root = current outer git root; inner contents moved up.
- Merge configs (git/docker/compose/requirements/docs/workflows) rather than duplicate; keep one .github at root.
- Ignore and/or delete generated caches and empty .agent-memory; ensure gitignore updated for data/logs/venv/node_modules caches.
