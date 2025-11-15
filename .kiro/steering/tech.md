# Tech Stack

## Core Framework

- **Next.js 15.4.5**: App Router with React Server Components
- **React 19.1.0**: Latest React with modern hooks
- **TypeScript 5+**: Strict mode enabled for type safety
- **Node.js 18+**: Required runtime version

## Styling & UI

- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Custom Design System**: 
  - Primary: `#2563eb` (blue)
  - Secondary: `#64748b` (slate)
  - Accent: `#f59e0b` (amber)
  - Background: `#f8fafc`
- **Inter Font**: Default sans-serif font family

## Backend & Data

- **Supabase**: PostgreSQL database, authentication, and file storage
- **@supabase/supabase-js**: Client library for database operations
- **@supabase/auth-helpers-nextjs**: Next.js authentication integration
- **Row Level Security (RLS)**: All tables have user-scoped access policies

## AI & External APIs

- **Google Gemini 1.5 Flash**: `@google/generative-ai` for CAD drawing analysis
- **Zoo Dev API**: `@kittycad/lib` for CAD model generation and conversion
- **OpenCascade.js**: WASM-based CAD file parsing (STEP format)

## 3D Visualization

- **Three.js**: 3D rendering engine for CAD model preview
- **@types/three**: TypeScript definitions

## File Handling

- **react-dropzone**: Drag-and-drop file upload interface
- **Multer types**: File upload handling in API routes

## Testing

- **Vitest**: Test runner with jsdom environment
- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers
- **@vitest/ui**: Visual test interface

## Development Tools

- **ESLint 9**: Code linting with Next.js config
- **Turbopack**: Fast bundler for development (via `--webpack` flag)
- **tsx**: TypeScript execution for scripts

## Path Aliases

Use `@/` prefix for imports from `src/`:
```typescript
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
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

# External APIs (optional - fallbacks available)
ZOO_API_TOKEN=your-zoo-dev-token
GEMINI_API_KEY=your-gemini-api-key

# Application
NEXTAUTH_URL=http://localhost:3000
```

## Webpack Configuration

- WASM files handled as assets for OpenCascade.js
- Server-side externalization of `opencascade.js` to prevent build errors
- Browser fallbacks for Node.js modules (fs, path, crypto)
