# Tech Stack

## Core Framework

- **Next.js 16.0.7**: App Router with React Server Components
- **React 19.1.0**: Latest React with modern hooks
- **TypeScript 5+**: Strict mode enabled for type safety
- **Node.js 18+**: Required runtime version

## Styling & UI

- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Framer Motion 12.23**: Animation library for smooth transitions
- **Lucide React 0.554**: Modern icon library
- **Custom Design System**: 
  - Primary: `#2563eb` (blue)
  - Secondary: `#64748b` (slate)
  - Accent: `#f59e0b` (amber)
  - Background: `#f8fafc`
- **Inter Font**: Default sans-serif font family

## Backend & Data

- **Supabase**: PostgreSQL database, authentication, and file storage
- **@supabase/supabase-js 2.81**: Client library for database operations
- **@supabase/ssr 0.7**: Server-side rendering support for Next.js
- **Row Level Security (RLS)**: All tables have user-scoped access policies

## State Management & Caching (3-Tier Architecture)

- **@tanstack/react-query 5.90**: Server state management with automatic caching
- **Zustand 5.0**: Client-side UI state with localStorage persistence
- **@upstash/redis 1.35**: Server-side API response caching (5-10 min TTL)

**Architecture Flow:**
```
Client Component
    ↓ (React Query)
Client API Wrapper (fetch)
    ↓ (HTTP)
Controller (thin, 30-90 lines)
    ↓
Service (business logic, validation, caching)
    ↓
Repository (database queries)
    ↓
Supabase Database
```

## AI & External APIs

- **Google Gemini 2.5 Flash**: `@google/generative-ai` for CAD drawing analysis
- **Zoo Dev API**: `@kittycad/lib` for CAD model generation and conversion
- **OpenCascade.js**: WASM-based CAD file parsing (STEP format)

## 3D Visualization

- **Three.js 0.181**: 3D rendering engine for CAD model preview
- **@react-three/fiber 9.4**: React renderer for Three.js
- **@react-three/drei 10.7**: Useful helpers for Three.js
- **@types/three**: TypeScript definitions

## File Handling

- **react-dropzone**: Drag-and-drop file upload interface
- **Multer types**: File upload handling in API routes

## Testing

- **Vitest 4.0**: Fast test runner with jsdom environment
- **@testing-library/react 16.0**: Component testing utilities
- **@testing-library/jest-dom 6.6**: Custom matchers
- **@vitest/ui 4.0**: Visual test interface

**Test Coverage:**
- Component tests: `src/__tests__/components/`
- CAD feature tests: `src/__tests__/cad/` (UC101, UC102, UC104)
- Utility tests: `src/__tests__/lib/`

## Development Tools

- **ESLint 9**: Code linting with Next.js config
- **Webpack**: Bundler with WASM support (via `--webpack` flag)
- **tsx 4.20**: TypeScript execution for scripts
- **@tanstack/react-query-devtools**: React Query debugging tools

## Path Aliases & Import Patterns

Use `@/` prefix for imports from `src/`:
```typescript
// Types
import { Product } from '@/types';

// Client-side API wrappers (used in hooks)
import { ProductAPI } from '@/lib/api/product-api';

// Services (used in API routes)
import { ProductService } from '@/services/product.service';

// Repositories (used in services)
import { ProductRepository } from '@/repositories/product.repository';

// Supabase clients
import { supabase } from '@/lib/supabase'; // Client-side
import { getSupabaseServer } from '@/lib/supabase-server'; // Server-side

// Components
import { Button } from '@/components/ui/Button';

// Hooks (with React Query)
import { useProducts } from '@/hooks/useProducts';

// Stores (Zustand)
import { useUIStore } from '@/stores/ui.store';
```

## Common Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests
npm test

# Test with UI
npm run test:ui

# Test coverage
npm run test:coverage

# Migrate products to Supabase
npx tsx scripts/migrate-products.ts
```

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (required for auth & database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Upstash Redis (optional - for server-side caching)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# External APIs (optional - fallbacks available)
ZOO_API_TOKEN=your-zoo-dev-token
GEMINI_API_KEY=your-gemini-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Never commit `.env` files. Use dedicated secrets management in production.

## Webpack Configuration

- WASM files handled as assets for OpenCascade.js
- Server-side externalization of `opencascade.js` to prevent build errors
- Browser fallbacks for Node.js modules (fs, path, crypto)


## Fast Refresh & Hot Module Replacement

**Fast Refresh** enables instant component updates without full page reloads. Follow these rules to avoid breaking it:

### ✅ Component Export Patterns (GOOD)

```typescript
// Pattern 1: Default export with named function
const MyComponent: React.FC = () => { ... };
export default MyComponent;

// Pattern 2: Named export only
export const MyComponent: React.FC = () => { ... };

// Pattern 3: Default export + types/interfaces
export type MyProps = { ... };
const MyComponent: React.FC<MyProps> = () => { ... };
export default MyComponent;
```

### ❌ Patterns That Break Fast Refresh (BAD)

```typescript
// ❌ BAD: Mixing component and utility exports
export const MyComponent = () => { ... };
export const calculateScore = (n: number) => n * 100; // Utility function

// ❌ BAD: Both named AND default export of same component
export const MyComponent = () => { ... };
export default MyComponent;

// ❌ BAD: Anonymous function components
export default () => { ... };

// ❌ BAD: camelCase component names (must be PascalCase)
const myComponent = () => { ... };
export default myComponent;

// ❌ BAD: Exporting lazy-loaded components from index files
// In index.ts:
export { ValidationTab } from './ValidationTab';
// In parent component:
const ValidationTab = lazy(() => import('./ValidationTab'));
```

### Component Naming Rules

- **Components**: PascalCase (e.g., `ProductCard`, `CADAnalyzer`)
- **Utility functions**: camelCase (e.g., `calculatePrice`, `formatDate`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProducts`, `useAuth`)

### File Organization

**Component files** (`src/components/**/*.tsx`):
- One primary component per file
- Export types/interfaces alongside component
- Keep utility functions internal (not exported) OR move to separate utility file

**Utility files** (`src/lib/**/*.ts`):
- Pure functions, no React components
- Multiple named exports allowed
- No JSX/TSX

**Example - Component with utilities:**
```typescript
// ✅ GOOD: Utilities internal to component
const MyComponent = () => {
  const formatPrice = (n: number) => `$${n.toFixed(2)}`; // Internal
  return <div>{formatPrice(100)}</div>;
};
export default MyComponent;

// ✅ BETTER: Utilities in separate file
// src/lib/price-utils.ts
export const formatPrice = (n: number) => `$${n.toFixed(2)}`;

// src/components/MyComponent.tsx
import { formatPrice } from '@/lib/price-utils';
const MyComponent = () => <div>{formatPrice(100)}</div>;
export default MyComponent;
```

### Lazy Loading Components

When using `React.lazy()`, do NOT export the component from index files:

```typescript
// ❌ BAD
// src/components/tabs/index.ts
export { ValidationTab } from './ValidationTab'; // Don't do this

// src/components/Parent.tsx
const ValidationTab = lazy(() => import('./tabs/ValidationTab')); // Conflict!

// ✅ GOOD
// src/components/tabs/index.ts
// Don't export lazy-loaded components

// src/components/Parent.tsx
const ValidationTab = lazy(() => import('./tabs/ValidationTab')); // Works!
```

### Debugging Fast Refresh Issues

If you see "Fast Refresh had to perform full reload":
1. Check for mixed component + utility exports
2. Verify component names are PascalCase
3. Ensure no anonymous function components
4. Check for duplicate exports (named + default of same component)
5. Verify lazy-loaded components aren't exported from index files
