# Requirements Document

## Introduction

This document outlines the requirements for implementing a modern state management and caching architecture for the SteelSmart application. The system will introduce React Query for server state management, Zustand for client state management, and Upstash Redis for server-side caching to improve performance, reduce database load, and enhance user experience.

## Glossary

- **Application**: The SteelSmart web application
- **React Query**: TanStack Query library for server state management
- **Zustand**: Lightweight state management library for client state
- **Redis Cache**: Upstash Redis serverless cache for API responses
- **Query Client**: React Query's client instance that manages cache
- **Mutation**: React Query operation that modifies server data
- **Store**: Zustand state container with actions
- **TTL**: Time To Live - duration before cached data expires
- **Stale Time**: Duration before React Query considers data stale
- **Cache Key**: Unique identifier for cached data in React Query or Redis
- **Service Layer**: Business logic layer that handles API communication
- **Product Catalog**: The collection of metal and steel products
- **CAD Generator**: Feature that generates CAD models from text prompts
- **API Route**: Next.js server endpoint that handles HTTP requests

## Requirements

### Requirement 1

**User Story:** As a developer, I want React Query integrated into the application, so that server state is managed efficiently with automatic caching and refetching

#### Acceptance Criteria

1. WHEN the Application starts, THE Application SHALL initialize a Query Client with default configuration
2. THE Application SHALL wrap all components with QueryClientProvider
3. THE Application SHALL include React Query DevTools in development mode
4. THE Query Client SHALL set staleTime to 60 seconds by default
5. THE Query Client SHALL set refetchOnWindowFocus to false by default

### Requirement 2

**User Story:** As a developer, I want product fetching converted to React Query, so that product data is cached and automatically synchronized

#### Acceptance Criteria

1. THE Application SHALL create a ProductService class with static methods for API calls
2. THE Application SHALL implement a useProducts hook using React Query's useQuery
3. WHEN filters change, THE Application SHALL generate unique cache keys including filter parameters
4. THE useProducts hook SHALL set staleTime to 5 minutes for product lists
5. THE useProducts hook SHALL return data, isLoading, error, and refetch properties

### Requirement 3

**User Story:** As a developer, I want CAD generation converted to React Query mutations, so that generation requests are properly managed with loading states

#### Acceptance Criteria

1. THE Application SHALL create a CADService class with generateCAD method
2. THE Application SHALL implement a useCADGeneration hook using React Query's useMutation
3. WHEN generation succeeds, THE Application SHALL invalidate the cad-history query cache
4. THE useCADGeneration hook SHALL return mutate, isPending, data, and error properties
5. THE Application SHALL call onSuccess callback after successful generation

### Requirement 4

**User Story:** As a developer, I want Zustand stores for client state, so that UI preferences and temporary state persist across sessions

#### Acceptance Criteria

1. THE Application SHALL create a CAD store with selectedFormat, selectedUnits, and recentPrompts state
2. THE CAD store SHALL persist state to localStorage using persist middleware
3. THE CAD store SHALL limit recentPrompts to 10 items maximum
4. THE Application SHALL integrate devtools middleware for debugging
5. WHEN a prompt is added, THE CAD store SHALL deduplicate and maintain order

### Requirement 6

**User Story:** As a developer, I want Upstash Redis configured, so that API responses can be cached server-side

#### Acceptance Criteria

1. THE Application SHALL initialize Redis client with environment variables
2. THE Application SHALL provide getCached function that accepts key, fetcher, and TTL parameters
3. WHEN cache hit occurs, THE getCached function SHALL return cached data immediately
4. WHEN cache miss occurs, THE getCached function SHALL execute fetcher and cache result
5. THE Application SHALL provide setCached and deleteCached utility functions

### Requirement 7

**User Story:** As a developer, I want product API routes cached with Redis, so that database queries are reduced

#### Acceptance Criteria

1. THE products API route SHALL check Redis cache before querying database
2. THE products API route SHALL generate cache keys including filter parameters
3. THE products API route SHALL cache responses with 300 second TTL
4. WHEN cache hit occurs, THE products API route SHALL log "Cache hit" message
5. WHEN cache miss occurs, THE products API route SHALL log "Cache miss" message

### Requirement 8

**User Story:** As a user, I want product catalog to load instantly on subsequent visits, so that I can browse products without waiting

#### Acceptance Criteria

1. WHEN the user navigates to catalog page, THE Application SHALL check React Query cache first
2. WHILE data is fresh, THE Application SHALL display cached products without API call
3. WHEN data becomes stale, THE Application SHALL refetch in background
4. THE Application SHALL display loading state only on initial load
5. THE Application SHALL maintain scroll position when refetching

### Requirement 9

**User Story:** As a user, I want my CAD format preferences remembered, so that I don't have to select them every time

#### Acceptance Criteria

1. WHEN the user selects a format, THE Application SHALL save preference to Zustand store
2. THE Application SHALL persist format preference to localStorage
3. WHEN the user returns to CAD generator, THE Application SHALL restore saved format
4. THE Application SHALL restore units preference from localStorage
5. THE Application SHALL display recent prompts from persisted state

### Requirement 10

**User Story:** As a developer, I want cache invalidation on data mutations, so that users see updated data after changes

#### Acceptance Criteria

1. WHEN CAD generation completes, THE Application SHALL invalidate cad-history query
2. WHEN product is updated, THE Application SHALL invalidate affected product queries
3. THE Application SHALL use queryClient.invalidateQueries with appropriate query keys
4. THE Application SHALL support manual cache invalidation via refetch function
5. THE Application SHALL clear Redis cache for invalidated queries

### Requirement 11

**User Story:** As a developer, I want proper error handling in caching layer, so that cache failures don't break the application

#### Acceptance Criteria

1. WHEN Redis operation fails, THE Application SHALL log error and continue
2. IF cache read fails, THE Application SHALL fallback to direct database query
3. IF cache write fails, THE Application SHALL return data without caching
4. THE Application SHALL not throw errors from cache operations
5. THE Application SHALL provide meaningful error messages in console

### Requirement 12

**User Story:** As a developer, I want different cache TTLs for different data types, so that cache strategy matches data volatility

#### Acceptance Criteria

1. THE Application SHALL cache product lists with 300 second TTL
2. THE Application SHALL cache product details with 600 second TTL
3. THE Application SHALL cache CAD analysis results with 86400 second TTL
4. THE Application SHALL cache product recommendations with 3600 second TTL
5. THE Application SHALL document TTL strategy in code comments
