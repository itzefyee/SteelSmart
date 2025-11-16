# Architecture Quick Reference

## 🏗️ Recommended Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected route group
│   └── api/v1/            # Versioned API
├── services/               # Business logic
├── repositories/          # Data access
├── components/            # UI components
├── hooks/                 # React hooks
├── stores/                # Client state (Zustand)
├── lib/                   # Utilities
└── types/                 # TypeScript types
```

## 📦 Key Dependencies to Add

```json
{
  "@tanstack/react-query": "^5.0.0",    // Server state
  "@upstash/redis": "^1.0.0",            // Caching
  "@upstash/ratelimit": "^2.0.0",        // Rate limiting
  "zod": "^3.22.0",                      // Validation
  "zustand": "^4.4.0"                    // Client state
}
```

## 🎯 Core Patterns

### 1. Service Layer
```typescript
// Business logic in services
class ProductService {
  async getProducts(filters) {
    return this.repo.findByFilters(filters);
  }
}
```

### 2. Repository Pattern
```typescript
// Data access in repositories
class ProductRepository {
  async findByFilters(filters) {
    return this.supabase.from('products').select('*');
  }
}
```

### 3. API Route Structure
```typescript
export async function POST(request) {
  await rateLimiter.check(request);
  const { user } = await requireAuth(request);
  const validated = await validateRequest(body, schema);
  const result = await service.method(validated);
  return NextResponse.json({ success: true, data: result });
}
```

## 🔄 State Management

- **Server State**: React Query (`@tanstack/react-query`)
- **Client State**: Zustand
- **Form State**: React Hook Form + Zod

## 💾 Caching Strategy

1. **Browser**: Static assets, images
2. **CDN**: Vercel Edge Network
3. **Next.js**: Route cache, fetch cache
4. **Redis**: API responses, computed data
5. **React Query**: Automatic request caching

## 🚨 Error Handling

```typescript
// Custom error classes
throw new ValidationError('Invalid input');
throw new NotFoundError('Product');
throw new UnauthorizedError();

// Handle in API routes
catch (error) {
  return handleApiError(error);
}
```

## ✅ Validation

```typescript
// Zod schemas
const schema = z.object({
  description: z.string().min(10).max(1000),
  format: z.enum(['step', 'stl', 'obj']),
});

// Validate in API routes
const validated = await validateRequest(body, schema);
```

## 🔒 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Input validation with Zod
- ✅ Rate limiting on API routes
- ✅ Authentication checks in middleware
- ✅ File upload validation

## 📊 Performance

- ✅ Database indexes on frequently queried columns
- ✅ Select specific fields (not `*`)
- ✅ Pagination for large datasets
- ✅ Code splitting with dynamic imports
- ✅ Image optimization with Next.js Image
- ✅ Streaming with Suspense

## 🧪 Testing

- **Unit**: Services, repositories, utilities
- **Integration**: API routes, database operations
- **E2E**: Critical user flows (Playwright)

## 📈 Monitoring

- Error tracking: Sentry
- Logging: Structured logger
- Analytics: Vercel Analytics

## 🚀 Migration Priority

1. **Week 1-2**: Repository pattern, error handling
2. **Week 3-4**: React Query, caching
3. **Week 5-6**: Rate limiting, monitoring
4. **Week 7-8**: Testing, documentation

## 📝 Code Examples

See `ARCHITECTURE_IMPLEMENTATION_GUIDE.md` for detailed code examples.

