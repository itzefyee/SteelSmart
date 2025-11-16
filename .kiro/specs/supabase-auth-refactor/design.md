# Design Document

## Overview

This design document outlines the architecture and implementation approach for refactoring the SteelSmart application to adopt a feature-based structure, complete Supabase integration, enhance authentication, add user account management, and improve the 3D model preview experience.

The refactoring will transform the current type-based file organization into a feature-based architecture where related components, API routes, hooks, and utilities are co-located. This improves maintainability, reduces cognitive load, and makes the codebase more scalable.

## Architecture

### Current Architecture Issues

1. **Type-Based Organization**: Files are organized by technical type (components/, api/, hooks/) rather than business features
2. **Scattered Feature Logic**: Related functionality is spread across multiple directories
3. **Hardcoded Data**: Some components still use JSON files and sample data arrays
4. **Incomplete Auth Integration**: Authentication exists but lacks proper navigation, logout, and account management
5. **Small 3D Preview**: CAD model preview doesn't utilize available screen space effectively

### Target Architecture

```
src/
├── app/
│   ├── (auth)/                   # Auth route group (public)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (protected)/              # Protected route group (requires auth)
│   │   ├── account/             # NEW: User account page
│   │   │   └── page.tsx
│   │   ├── cad-analyzer/
│   │   │   └── page.tsx
│   │   ├── cad-generator/
│   │   │   └── page.tsx
│   │   ├── rfq/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/                # Auth-related APIs
│   │   │   └── profile/        # NEW: Profile API (requires auth)
│   │   ├── cad/                 # CAD-related APIs (require auth)
│   │   │   ├── analyze-drawing/
│   │   │   ├── generate/
│   │   │   └── history/
│   │   ├── products/            # NEW: Products API (public)
│   │   ├── categories/          # NEW: Categories API (public)
│   │   ├── rfq/                 # RFQ APIs (require auth)
│   │   │   └── submit/
│   │   └── webhooks/            # Webhooks (public with validation)
│   ├── catalog/                 # Public catalog
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx                 # Public homepage
│   └── middleware.ts            # NEW: Route protection
├── components/
│   ├── auth/                    # Auth-related components
│   │   ├── LoginForm.tsx       # NEW: Extracted from login page
│   │   ├── SignupForm.tsx      # NEW: Extracted from signup page
│   │   └── AuthProvider.tsx    # Moved from root
│   ├── account/                 # NEW: Account page components (protected)
│   │   ├── ProfileSection.tsx
│   │   ├── CADHistorySection.tsx
│   │   ├── AccountStatsSection.tsx
│   │   └── SettingsSection.tsx
│   ├── cad/                     # CAD-related components (protected)
│   │   ├── CADGenerator.tsx
│   │   ├── CADAnalyzer.tsx
│   │   ├── CADPreview.tsx      # Enhanced 3D preview
│   │   └── CADHistoryList.tsx
│   ├── products/                # Product-related components (public)
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── FeaturedProducts.tsx
│   │   └── ProductDetail.tsx
│   ├── rfq/                     # RFQ-related components (protected)
│   │   ├── RFQForm.tsx
│   │   └── RFQFileUpload.tsx
│   ├── layout/                  # Layout components (public)
│   │   ├── Header.tsx          # Enhanced with auth nav
│   │   ├── Footer.tsx
│   │   └── Hero.tsx
│   └── ui/                      # UI primitives (public)
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── ...
├── hooks/                       # Custom hooks
│   ├── useCADGeneration.ts     # Protected
│   ├── useCADAnalysis.ts       # Protected
│   ├── useProducts.ts          # Public
│   ├── useCategories.ts        # NEW: Public
│   ├── useProfile.ts           # NEW: Protected
│   └── useCADHistory.ts        # NEW: Protected
├── lib/                         # Utilities and clients
│   ├── supabase.ts             # Client-side Supabase
│   ├── supabase-server.ts      # Server-side Supabase
│   ├── gemini-client.ts        # Protected
│   ├── zoo-client.ts           # Protected
│   └── utils.ts                # Public utilities
├── types/                       # TypeScript types
│   └── index.ts
└── data/                        # DEPRECATED: To be removed
    ├── products.json           # Migrate to Supabase
    ├── categories.json         # Migrate to Supabase
    └── sample-data.ts          # Remove after migration
```

### Route Protection Strategy

#### Public Routes (No Auth Required)
- `/` - Homepage
- `/catalog` - Product catalog
- `/catalog/[id]` - Product details
- `/login` - Login page
- `/signup` - Signup page

#### Protected Routes (Auth Required)
- `/account` - User account page
- `/cad-generator` - CAD generation tool
- `/cad-analyzer` - CAD analysis tool
- `/rfq` - Request for quote
- `/reports` - User reports

#### API Route Protection

**Public APIs**:
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories

**Protected APIs** (require authentication):
- `POST /api/cad/generate` - Generate CAD model
- `GET /api/cad/history` - Get user's CAD history
- `DELETE /api/cad/history/:id` - Delete history item
- `POST /api/cad/analyze-drawing` - Analyze drawing
- `POST /api/rfq/submit` - Submit RFQ
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Key Architectural Decisions

1. **Type-Based Organization**: Maintain current structure (components/, hooks/, lib/, types/)
2. **Organized Components**: Group components by domain (account/, cad/, products/, rfq/, layout/, ui/)
3. **Proxy Protection**: Use existing proxy.ts pattern (Next.js 15+ practice) to protect authenticated routes
4. **New Files Use Feature Pattern**: New features can use feature-based organization in the future
5. **Supabase-First**: All data operations go through Supabase (no JSON files)

## Components and Interfaces

### 1. Authentication System

#### Enhanced AuthProvider

**Location**: `src/components/AuthProvider.tsx` (existing, to be enhanced)

**Responsibilities**:
- Manage authentication state
- Provide sign in, sign up, sign out methods
- Handle session persistence
- Expose user profile data

**Interface**:
```typescript
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

interface UserProfile {
  id: string;
  email: string;
  company?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface UserMetadata {
  company?: string;
  phone?: string;
}
```

#### Enhanced Header Component

**Location**: `src/components/Header.tsx` → move to `src/components/layout/Header.tsx`

**New Features**:
- Display user email/name when authenticated
- Show "Account" link in navigation
- Show "Logout" button when authenticated
- Show "Login" and "Sign Up" when unauthenticated

**Interface**:
```typescript
interface HeaderProps {
  // No props needed - uses AuthContext
}
```

#### Proxy for Route Protection

**Location**: `src/proxy.ts` (existing, to be enhanced)

**Responsibilities**:
- Protect routes that require authentication
- Redirect unauthenticated users to login
- Allow public routes (catalog, home)
- Handle auth state refresh
- Protect API routes

**Enhanced Implementation**:
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Public API routes (no auth required)
  const publicApiRoutes = [
    '/api/products',
    '/api/categories',
    '/api/webhooks'
  ];

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Protect API routes (except public ones)
  if (req.nextUrl.pathname.startsWith('/api') && !isPublicApiRoute) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
  }

  // Protected page routes that require authentication
  const protectedPaths = [
    '/account',
    '/cad-generator',
    '/cad-analyzer',
    '/rfq',
    '/reports'
  ];

  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login/signup pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|sample-drawings).*)',
  ],
};
```

### 2. User Account Page

#### AccountPage Component

**Location**: `src/app/(protected)/account/page.tsx`

**Sections**:
1. Profile Information
2. CAD Generation History
3. Account Statistics
4. Settings

**Interface**:
```typescript
interface AccountPageProps {
  // Server component - no props
}
```

#### ProfileSection Component

**Location**: `src/components/account/ProfileSection.tsx`

**Features**:
- Display user email, company, phone
- Edit mode for updating profile
- Save/cancel buttons
- Validation and error handling

**Interface**:
```typescript
interface ProfileSectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}
```

#### CADHistorySection Component

**Location**: `src/components/account/CADHistorySection.tsx`

**Features**:
- Paginated list of CAD generations
- Filter by status, format, date
- View details modal
- Delete history items
- Download CAD files

**Interface**:
```typescript
interface CADHistorySectionProps {
  userId: string;
}

interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data_url?: string;
  generated_at: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
}
```

#### AccountStatsSection Component

**Location**: `src/components/account/AccountStatsSection.tsx`

**Displays**:
- Total CAD generations
- Total RFQ submissions
- Total drawing analyses
- Account creation date

**Interface**:
```typescript
interface AccountStatsProps {
  stats: {
    totalCADGenerations: number;
    totalRFQs: number;
    totalAnalyses: number;
    memberSince: string;
  };
}
```

### 3. Component Organization

#### CAD Components

**Location**: `src/components/cad/`

**Components**:
- `CADGenerator.tsx` - Main generator interface (existing, move here)
- `CADAnalyzer.tsx` - Main analyzer interface (existing, move here)
- `CADPreview.tsx` - Enhanced 3D preview (larger size)
- `CADHistoryList.tsx` - History sidebar

**API Routes** (existing):
- `POST /api/generate-cad` - Generate CAD model
- `GET /api/cad-history` - Get user's history
- `DELETE /api/cad-history` - Delete history item
- `POST /api/analyze-drawing` - Analyze drawing

**Hooks**:
- `useCADGeneration()` - Handle generation logic (existing in hooks/)
- `useCADHistory()` - Fetch and manage history (NEW in hooks/)
- `useCADAnalysis()` - Handle analysis logic (existing in hooks/)

#### Product Components

**Location**: `src/components/products/`

**Components**:
- `ProductCard.tsx` - Product display card (existing, move here)
- `ProductGrid.tsx` - Grid layout (NEW)
- `ProductFilters.tsx` - Category/material filters (NEW)
- `FeaturedProducts.tsx` - Featured products section (existing, move here)

**API Routes** (NEW):
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - Get categories

**Hooks** (NEW):
- `useProducts()` - Fetch products with filters
- `useCategories()` - Fetch categories

#### RFQ Components

**Location**: `src/components/rfq/`

**Components**:
- `RFQForm.tsx` - Multi-step form (existing, move here)
- `RFQFileUpload.tsx` - Attachment upload (NEW)

**API Routes** (existing):
- `POST /api/submit-rfq` - Submit RFQ

**Hooks**:
- `useRFQSubmission()` - Handle form submission (existing in hooks/)

## Data Models

### Database Schema Additions

#### Categories Table

```sql
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Insert initial data
INSERT INTO categories (id, name, description, icon) VALUES
  ('robotic', 'Robotic Components', 'Motors, actuators, sensors, and control systems for robotics applications', 'robot'),
  ('structural', 'Structural Steel', 'Beams, plates, angles, and custom structural components', 'building'),
  ('fasteners', 'Fasteners', 'Bolts, screws, nuts, washers, and specialty fastening hardware', 'wrench'),
  ('custom', 'Custom Parts', 'Made-to-order fabricated components and custom machining services', 'cog');
```

### TypeScript Interfaces

#### User Profile

```typescript
interface UserProfile {
  id: string;
  email: string;
  company?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
```

#### Product

```typescript
interface Product {
  id: string;
  name: string;
  category: 'robotic' | 'structural' | 'fasteners' | 'custom';
  material: string;
  specifications: Record<string, any>;
  price: number;
  images: string[];
  description: string;
  technical_details: string;
  compatible_with: string[];
  in_stock: boolean;
  lead_time: string;
  created_at: string;
  updated_at: string;
}
```

#### Category

```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}
```

#### CAD History Item

```typescript
interface CADHistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data_url?: string;
  file_path?: string;
  file_size?: number;
  generated_at: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  zoo_operation_id?: string;
  metadata: Record<string, any>;
}
```

## Error Handling

### Authentication Errors

1. **Invalid Credentials**: Display user-friendly message on login form
2. **Session Expired**: Redirect to login with message
3. **Network Errors**: Show retry option with error details

### API Errors

1. **Unauthorized (401)**: Redirect to login
2. **Forbidden (403)**: Show access denied message
3. **Not Found (404)**: Show resource not found message
4. **Server Error (500)**: Show generic error with retry option

### File Upload Errors

1. **File Too Large**: Show size limit message
2. **Invalid Format**: Show supported formats
3. **Upload Failed**: Show retry option

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*');
    
  if (error) throw error;
  
  return { data, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  return { 
    data: null, 
    error: error instanceof Error ? error : new Error('Unknown error') 
  };
}
```

## Testing Strategy

### Unit Tests

**Focus Areas**:
- Utility functions (data transformations, validations)
- Custom hooks (useCADGeneration, useProducts)
- API route handlers

**Tools**: Vitest, @testing-library/react

**Example**:
```typescript
describe('useCADGeneration', () => {
  it('should generate CAD model successfully', async () => {
    // Test implementation
  });
  
  it('should handle generation errors', async () => {
    // Test implementation
  });
});
```

### Integration Tests

**Focus Areas**:
- Authentication flow (signup → login → logout)
- CAD generation flow (input → generate → preview → save)
- Product browsing (filter → view → details)

**Tools**: Vitest, @testing-library/react, MSW (Mock Service Worker)

### Component Tests

**Focus Areas**:
- User interactions (form submissions, button clicks)
- Conditional rendering (auth states, loading states)
- Error states

**Example**:
```typescript
describe('ProfileSection', () => {
  it('should display user profile information', () => {
    // Test implementation
  });
  
  it('should allow editing profile', async () => {
    // Test implementation
  });
});
```

### E2E Tests (Optional)

**Focus Areas**:
- Critical user journeys
- Cross-feature workflows

**Tools**: Playwright or Cypress

## Enhanced 3D Model Preview

### Design Specifications

**Desktop**:
- Minimum height: 600px
- Width: 60% of viewport width on generator page
- Full-width modal option for detailed inspection

**Mobile**:
- Minimum height: 400px
- Full-width with responsive controls

### Features

1. **Interactive Controls**:
   - Orbit (rotate around model)
   - Zoom (mouse wheel or pinch)
   - Pan (right-click drag or two-finger drag)
   - Reset camera button

2. **Loading States**:
   - Skeleton loader while model loads
   - Progress indicator for large files

3. **Error States**:
   - Clear error message
   - Troubleshooting tips
   - Retry button

4. **Performance**:
   - Lazy load Three.js library
   - Optimize model rendering
   - Dispose of resources on unmount

### Implementation

**Location**: `src/features/cad-generation/components/CADPreview.tsx`

**Key Technologies**:
- Three.js for 3D rendering
- React Three Fiber (optional, for React integration)
- OrbitControls for camera manipulation

**Interface**:
```typescript
interface CADPreviewProps {
  modelUrl: string;
  format: 'step' | 'stl' | 'obj' | 'gltf';
  size?: 'default' | 'large' | 'fullscreen';
  onError?: (error: Error) => void;
  onLoad?: () => void;
}
```

## Migration Strategy

### Phase 1: Authentication Infrastructure

1. Enhance proxy.ts for route protection (add protected paths)
2. Enhance AuthProvider with profile support
3. Update Header with auth navigation (login/logout/account)
4. Create profile API routes
5. Add logout functionality to Header

### Phase 2: Component Organization

1. Create component subdirectories (auth/, account/, cad/, products/, rfq/, layout/)
2. Move existing components to appropriate directories
3. Extract LoginForm and SignupForm components
4. Update all component imports

### Phase 3: Supabase Integration

1. Replace product JSON imports with Supabase queries
2. Replace category JSON imports with Supabase queries
3. Remove sample data dependencies
4. Update API routes to use Supabase consistently

### Phase 4: User Account Page

1. Create account page route (/account)
2. Implement ProfileSection component
3. Implement CADHistorySection component
4. Implement AccountStatsSection component
5. Add SettingsSection component
6. Create useProfile and useCADHistory hooks

### Phase 5: Enhanced 3D Preview

1. Enhance CADPreview component (600px height, 60% width)
2. Add interactive controls (orbit, zoom, pan, reset)
3. Implement loading and error states
4. Add fullscreen mode option
5. Optimize performance and resource cleanup

### Phase 6: Testing and Validation

1. Write unit tests for new features
2. Test authentication flows
3. Test data fetching and mutations
4. Validate responsive design
5. Performance testing

## Security Considerations

1. **Row Level Security**: All user data tables have RLS policies
2. **Authentication Required**: Protected routes require valid session
3. **Input Validation**: Validate all user inputs on client and server
4. **File Upload Security**: Validate file types and sizes
5. **API Rate Limiting**: Consider implementing rate limiting for API routes
6. **CORS Configuration**: Properly configure CORS for API routes
7. **Environment Variables**: Never expose service role key to client

## Performance Optimizations

1. **Code Splitting**: Use dynamic imports for heavy components
2. **Image Optimization**: Use Next.js Image component
3. **Database Indexing**: Ensure proper indexes on frequently queried columns
4. **Caching**: Implement caching for product catalog
5. **Lazy Loading**: Lazy load 3D preview and heavy libraries
6. **Pagination**: Implement pagination for history lists
7. **Debouncing**: Debounce search and filter inputs

## Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Color Contrast**: Meet WCAG AA standards
4. **Focus Indicators**: Clear focus states for all interactive elements
5. **Error Messages**: Clear, descriptive error messages
6. **Form Labels**: All form inputs have associated labels
