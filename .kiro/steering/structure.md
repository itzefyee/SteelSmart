# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API route handlers
│   ├── cad-analyzer/      # CAD analysis page
│   ├── cad-generator/     # CAD generation page
│   ├── catalog/           # Product catalog with [id] dynamic routes
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── rfq/              # Request for Quote
│   ├── reports/          # User reports/history
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Homepage
│   └── globals.css       # Global styles + Tailwind
├── components/           # React components
│   └── ui/              # Reusable UI primitives
├── data/                # JSON data files
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries & clients
├── types/               # TypeScript type definitions
└── __tests__/           # Test files
```

## Key Conventions

### API Routes (`src/app/api/`)

- Server-side only, use Supabase service role for admin operations
- Return JSON responses with proper error handling
- Example: `api/analyze-drawing/route.ts`, `api/recommendations/route.ts`

### Components (`src/components/`)

- **Client Components**: Use `'use client'` directive for interactivity
- **Server Components**: Default, no directive needed
- **UI Components**: Reusable primitives in `components/ui/` (Button, Input, Modal, etc.)
- **Feature Components**: Domain-specific (CADAnalyzer, ProductCard, RFQForm)

### Data Layer (`src/data/`)

- `products.json`: Product catalog (20+ items)
- `categories.json`: Category definitions
- `sample-data.ts`: Mock data for development

### Hooks (`src/hooks/`)

- Custom hooks for reusable logic
- Examples: `useCADAnalysis`, `useCADGeneration`, `useFileUpload`
- Export from `index.ts` for clean imports

### Libraries (`src/lib/`)

- **API Clients**: `gemini-client.ts`, `zoo-client.ts`
- **Supabase**: `supabase.ts` (client), `supabase-server.ts` (server)
- **Business Logic**: `product-matcher.ts`, `cad-analyzer-utils.ts`
- **Utilities**: `utils.ts`, `logger.ts`

### Types (`src/types/`)

- All TypeScript interfaces and types in `index.ts`
- Shared across entire application
- Examples: `Product`, `CADHistoryItem`, `DrawingAnalysis`, `RFQSubmission`

## File Naming

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities**: kebab-case (e.g., `product-matcher.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCADAnalysis.ts`)
- **API Routes**: `route.ts` (Next.js convention)

## Import Patterns

Use path alias for cleaner imports:
```typescript
// Good
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

// Avoid
import { Product } from '../../../types';
```

## Component Patterns

### Client Components
```typescript
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState();
  // Interactive logic
}
```

### Server Components
```typescript
import { getSupabaseServer } from '@/lib/supabase-server';

export default async function MyPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  // Server-side data fetching
}
```

## Database Access

- **Client-side**: Use `@/lib/supabase` (respects RLS)
- **Server-side**: Use `@/lib/supabase-server` (can use service role)
- All tables have Row Level Security policies
- Users can only access their own data by default

## Storage Buckets

- `cad-models`: User-generated CAD files (private)
- `technical-drawings`: Uploaded drawings for analysis (private)
- `rfq-attachments`: RFQ submission files (private)
- `product-images`: Public product images (public)

## Testing Structure

```
src/__tests__/
├── components/        # Component tests
└── lib/              # Utility function tests
```

Use Vitest with React Testing Library for component tests.
