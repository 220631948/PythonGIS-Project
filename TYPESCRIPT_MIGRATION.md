# TypeScript Migration Guide

## What Changed
- File extensions changed from `.jsx` to `.tsx` and `.js` to `.ts`.
- Type definitions are located in `src/types`.
- Import paths updated to use path aliases (e.g., `@components/...`).

**Example Import Change:**
Before:
```javascript
import Button from '../components/Button';
```
After:
```typescript
import Button from '@/components/Button';
```

## Adding New Components

### Component Template
```typescript
import React from 'react';

interface Props {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const MyComponent: React.FC<Props> = ({ label, onClick }) => {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
};

export default MyComponent;
```

## Common Patterns

### Typed Hooks
```typescript
const [count, setCount] = useState<number>(0);
const inputRef = useRef<HTMLInputElement>(null);
```

### Event Handlers
```typescript
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};

const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault();
};
```

### API Calls
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
}

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();
  return json as T;
}
```

### Component State
```typescript
import { useState } from 'react';

interface User {
  id: number;
  name: string;
}

const [user, setUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);
```

### Leaflet Integration
```typescript
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';

const mapRef = useRef<LeafletMap | null>(null);

const handleMapReady = (map: LeafletMap) => {
  mapRef.current = map;
  L.marker([lat, lng]).addTo(map);
};
```

## Troubleshooting

### Type Checking
Run the following command to check for type errors:
```bash
npm run type-check
```

### Path Alias Verification
Ensure `tsconfig.json` has the correct `paths` configuration.

### Leaflet Type Imports
Use `@types/leaflet` for Leaflet types.
```typescript
import L from 'leaflet';
```
