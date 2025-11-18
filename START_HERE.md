# 🚀 START HERE - Quick Guide

## 👋 Welcome!

You're working on adding **React Query**, **Zustand**, and **Redis caching** to the Metalyze project.

---

## 📖 Documentation Guide

### Read in this order:

1. **THIS FILE** (you are here) - Quick overview
2. **`YOUR_TASK_PLAN.md`** - Step-by-step implementation plan ⭐ **START HERE**
3. **`ONBOARDING_GUIDE.md`** - Full project context
4. **`QUICK_START_CHEATSHEET.md`** - Code snippets reference
5. **`MIGRATION_EXAMPLES.md`** - Detailed migration examples
6. **`ARCHITECTURE_VISUAL.md`** - Visual diagrams

---

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd Metalyze
npm install @tanstack/react-query @upstash/redis zustand
npm install -D @tanstack/react-query-devtools
```

### 2. Get Upstash Redis Credentials
1. Go to https://console.upstash.com/
2. Sign up (free tier)
3. Create database
4. Copy REST URL and TOKEN

### 3. Add to `.env.local`
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 4. Follow the Plan
Open **`YOUR_TASK_PLAN.md`** and follow Phase 1 → Phase 2 → Phase 3

---

## 🎯 What You're Building

### Before (Current)
```
Component → useState → fetch() → API → Database
❌ No caching
❌ Manual state management
❌ Duplicate requests
```

### After (Your Task)
```
Component → React Query → Service → API → Redis Cache → Database
✅ Automatic caching
✅ Smart refetching
✅ Optimistic updates
✅ Persistent UI state (Zustand)
```

---

## 📋 Your Tasks

### Phase 1: Setup (Day 1-2)
- [ ] Install dependencies
- [ ] Create `providers.tsx` with React Query
- [ ] Create `redis-cache.ts` utility
- [ ] Test setup works

### Phase 2: Products (Day 3-4)
- [ ] Create `ProductService`
- [ ] Convert `useProducts` to React Query
- [ ] Add Redis caching to `/api/products`
- [ ] Update catalog page

### Phase 3: CAD Generation (Day 5-6)
- [ ] Create Zustand store for CAD UI state
- [ ] Create `CADService`
- [ ] Convert `useCADGeneration` to React Query
- [ ] Update CAD generator page

---

## 🔧 Key Technologies

### React Query
**Purpose**: Server state management (data from API)
**Use for**: Products, CAD history, user data
**Benefits**: Automatic caching, refetching, loading states

### Zustand
**Purpose**: Client state management (UI preferences)
**Use for**: Format selection, recent prompts, theme
**Benefits**: Simple API, persistence, DevTools

### Upstash Redis
**Purpose**: Server-side caching
**Use for**: API responses, expensive computations
**Benefits**: Reduce database load, faster responses

---

## 🐛 Common Issues

### "Cannot find module"
→ Run `npm install` again

### "Redis connection failed"
→ Check `.env.local` credentials

### "QueryClient not found"
→ Wrap app in `<Providers>` in `layout.tsx`

### "State not persisting"
→ Check browser localStorage

---

## 🆘 Need Help?

1. Check `YOUR_TASK_PLAN.md` for detailed steps
2. Look at `MIGRATION_EXAMPLES.md` for code examples
3. Use `QUICK_START_CHEATSHEET.md` for quick reference
4. Check existing code in `src/hooks/` for patterns

---

## ✅ Success Criteria

You're done when:
- ✅ Products load from React Query cache
- ✅ CAD generation uses mutations
- ✅ Format/units persist in Zustand
- ✅ Redis caches API responses
- ✅ React Query DevTools shows queries
- ✅ No breaking changes

---

## 🎯 Next Step

**Open `YOUR_TASK_PLAN.md` and start with Phase 1!**

Good luck! 🚀
