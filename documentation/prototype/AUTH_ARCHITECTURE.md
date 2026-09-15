# Authentication Architecture

## Overview
SteelSmart uses Supabase for authentication with proper SSR (Server-Side Rendering) support via the `@supabase/ssr` package.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User logs in → Supabase sets auth cookies            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    middleware.ts (Root)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Exports proxy function from src/proxy.ts              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      src/proxy.ts                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Creates Supabase client with SSR cookie handling  │ │
│  │  2. Refreshes user session automatically              │ │
│  │  3. Protects routes (redirects if not authenticated)  │ │
│  │  4. Passes request to Next.js with updated cookies    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Routes / Pages                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Use getSupabaseServer() to access authenticated user │ │
│  │  Cookies are properly set by middleware                │ │
│  │  Can read user.id, user.email, etc.                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Client-Side Auth (`src/lib/supabase.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(url, key);
```
- Used in React components
- Handles login/logout
- Manages client-side session

### 2. Middleware (`middleware.ts` + `src/proxy.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(url, key, {
  cookies: { get, set, remove }
});
```
- Intercepts all requests
- Refreshes auth tokens
- Protects routes
- Sets cookies for API routes

### 3. Server-Side Auth (`src/lib/supabase-server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: { get, set, remove }
  });
}
```
- Used in API routes
- Used in Server Components
- Reads cookies set by middleware
- Accesses authenticated user

## Protected Routes

### Pages (Redirect to Login)
- `/account`
- `/cad-generator`
- `/cad-analyzer`
- `/rfq`
- `/reports`

### API Routes (Return 401)
- All `/api/*` routes except:
  - `/api/auth/*` (public)
  - `/api/products/*` (public)
  - `/api/categories/*` (public)
  - `/api/webhooks/*` (public)

## Cookie Flow

1. **User logs in** → Supabase sets cookies in browser
2. **Request made** → Browser sends cookies with request
3. **Middleware intercepts** → Reads cookies, refreshes session
4. **Middleware updates** → Sets new/updated cookies in response
5. **API route receives** → Can read cookies via `getSupabaseServer()`
6. **API route uses** → `await supabase.auth.getUser()` returns user

## Common Issues & Solutions

### Issue: "User not authenticated" in API routes
**Cause**: Cookies not being passed or read properly
**Solution**: Ensure middleware is running (check `middleware.ts` exists in root)

### Issue: Session expires quickly
**Cause**: Middleware not refreshing tokens
**Solution**: Verify `proxy.ts` calls `supabase.auth.getSession()`

### Issue: Cookies not set
**Cause**: Cookie options missing or incorrect
**Solution**: Check cookie `set()` method includes proper options (path, sameSite, secure)

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing Authentication

### Check if user is authenticated (Client)
```typescript
import { supabase } from '@/lib/supabase';

const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### Check if user is authenticated (Server)
```typescript
import { getSupabaseServer } from '@/lib/supabase-server';

const supabase = await getSupabaseServer();
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

## Best Practices

1. **Always use `getSupabaseServer()`** in API routes and Server Components
2. **Always use `supabase` or `getSupabaseClient()`** in Client Components
3. **Never use service role key** in client-side code
4. **Always check for user** before accessing protected resources
5. **Handle auth errors gracefully** with proper error messages

## Security Notes

- Middleware ensures tokens are always fresh
- RLS (Row Level Security) policies protect database access
- Service role key should only be used server-side for admin operations
- Never expose service role key in client code
- Always validate user permissions in API routes
