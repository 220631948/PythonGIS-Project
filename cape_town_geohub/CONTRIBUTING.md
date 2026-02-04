# Contributing to Cape Town GeoHub

Thank you for considering contributing to Cape Town GeoHub! This document provides guidelines and information for contributors.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd cape_town_geohub

# Install dependencies
make install

# Start development
make docker-up   # Or: make dev for local development
```

## 📋 Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/pdf-export`)
- `fix/` - Bug fixes (e.g., `fix/map-zoom-issue`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(api): add site suitability endpoint
fix(map): resolve invalid LatLng error
docs(readme): update installation steps
refactor(spatial): extract common analysis utils
test(api): add health endpoint tests
```

## 🎨 Code Style

### Python (Backend)

- **Linter**: Ruff
- **Formatter**: Ruff format
- **Type Hints**: Required for all function signatures
- **Docstrings**: Google style for public functions

```python
def calculate_accessibility(
    point: Point,
    facilities: GeoDataFrame,
    max_distance_m: float = 1000.0,
) -> AccessibilityResult:
    """Calculate accessibility score for a given point.
    
    Args:
        point: The location to analyze.
        facilities: GeoDataFrame of facility points.
        max_distance_m: Maximum search distance in meters.
        
    Returns:
        AccessibilityResult with score and nearest facilities.
    """
    ...
```

### TypeScript (Frontend)

- **Linter**: ESLint with TypeScript plugin
- **Formatter**: Prettier
- **Components**: Functional components only
- **Types**: Explicit interfaces for props and state

```tsx
interface LayerCardProps {
  layer: SpatialLayer;
  isActive: boolean;
  onToggle: (layerId: string) => void;
}

export function LayerCard({ layer, isActive, onToggle }: LayerCardProps) {
  // Component implementation
}
```

### CSS

- Use CSS custom properties (variables) from `index.css`
- Follow BEM naming for complex components
- Mobile-first responsive design

## 🧪 Testing

### Before Submitting

```bash
# Run all checks
make lint          # Linting
make type-check    # TypeScript types
make test          # All tests
```

### Writing Tests

**Backend Tests** (pytest):
```python
def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

**Frontend Tests** (Playwright):
```typescript
test('map loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.leaflet-container')).toBeVisible();
});
```

## 📐 Architecture Guidelines

### Spatial Data Rules

- **CRS**: Always use EPSG:4326 for storage and API responses
- **Projections**: Use EPSG:32734 (UTM 34S) for distance calculations
- **GeoJSON**: Ensure RFC 7946 compliance (CCW winding)

### API Design

- RESTful endpoints under `/api/`
- Pydantic models for request/response validation
- Consistent error responses with `detail` field

### Component Structure

```
frontend/src/
├── components/     # Shared UI components
├── modules/        # Feature-specific modules
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

## 🔄 Pull Request Process

1. **Create feature branch** from `main`
2. **Make changes** following style guidelines
3. **Run checks**: `make lint && make test`
4. **Push branch** and create PR
5. **Request review** from maintainers
6. **Address feedback** and update PR
7. **Merge** after approval

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No lint errors or type errors
- [ ] Commit messages follow convention

## 🐛 Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

## 📚 Additional Resources

- [User Guide](docs/USER_GUIDE.md)
- [Technical Docs](docs/TECHNICAL_DOCS.md)
- [Data Sources](DATA_SOURCES.md)
- [Ethics Policy](ETHICS.md)

## 📝 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Questions? Open an issue or reach out to the maintainers.
