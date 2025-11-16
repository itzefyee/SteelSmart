# Implementation Plan

## Recent Changes Noted

The following new files and features have been added since the spec was created:
- `CADAnalyzerFull.tsx` - Full-featured CAD analyzer with manufacturing analysis
- `CADPreview3D.tsx` - Advanced 3D model viewer
- `cad-parser.ts` - Enhanced with manufacturing analysis capabilities
- `cad-manufacturing-analyzer.ts` - NEW: Manufacturing analysis utilities
- `compliance-checker.ts` - NEW: Standards compliance checking
- `standards-database.ts` - NEW: Manufacturing standards database

These components have been incorporated into the implementation plan below.

---

- [ ] 1. Database Schema and Migration
- [ ] 1.1 Create categories table migration
  - Create SQL migration file for categories table
  - Add id, name, description, icon fields
  - Enable RLS with public read policy
  - Insert initial 4 categories (robotic, structural, fasteners, custom)
  - _Requirements: 2.2, 2.9_

- [ ] 1.2 Run categories migration in Supabase
  - Execute migration in Supabase SQL Editor
  - Verify table creation and data insertion
  - Test RLS policies
  - _Requirements: 2.2, 2.9_

- [ ] 2. Authentication Infrastructure
- [ ] 2.1 Enhance proxy.ts for route protection
  - Add protected paths array (account, cad-generator, cad-analyzer, rfq, reports)
  - Implement redirect logic for unauthenticated users
  - Add redirectTo query parameter for post-login navigation
  - Update public API routes list (products, categories)
  - _Requirements: 3.8, 3.9_

- [ ] 2.2 Enhance AuthProvider with profile support
  - Add profile state to AuthContext
  - Fetch user profile on authentication
  - Add updateProfile method to context
  - Handle profile loading states
  - _Requirements: 3.5, 3.6_

- [ ] 2.3 Create profile API routes
  - Create GET /api/auth/profile route
  - Create PUT /api/auth/profile route
  - Implement profile update validation
  - Add error handling
  - _Requirements: 3.6, 4.6_

- [ ] 3. Component Organization

- [ ] 3.1 Create component subdirectories
  - Create components/auth/ directory
  - Create components/account/ directory
  - Create components/cad/ directory
  - Create components/products/ directory
  - Create components/rfq/ directory
  - Create components/layout/ directory
  - _Requirements: 1.1_

- [ ] 3.2 Move Header to layout directory
  - Move Header.tsx to components/layout/
  - Update all imports referencing Header
  - _Requirements: 1.7, 6.1_

- [ ] 3.3 Move Footer and Hero to layout directory
  - Move Footer.tsx to components/layout/
  - Move Hero.tsx to components/layout/
  - Update all imports
  - _Requirements: 1.7_

- [ ] 3.4 Move AuthProvider to auth directory
  - Move AuthProvider.tsx to components/auth/
  - Update import in app/layout.tsx
  - _Requirements: 1.7_

- [ ] 3.5 Move CAD components to cad directory
  - Move CADGenerator.tsx to components/cad/
  - Move CADAnalyzer.tsx to components/cad/
  - Move CADAnalyzerFull.tsx to components/cad/
  - Move CADPreview3D.tsx to components/cad/
  - Move CADHistory.tsx to components/cad/
  - Move CADGenerationDebug.tsx to components/cad/
  - Update all imports in page files
  - _Requirements: 1.1, 1.7_

- [ ] 3.6 Move product components to products directory
  - Move ProductCard.tsx to components/products/
  - Move FeaturedProducts.tsx to components/products/
  - Move ProductDetailClient.tsx to components/products/
  - Move ProductFilter.tsx to components/products/
  - Move ProductImagePlaceholder.tsx to components/products/
  - Move ProductRecommendations.tsx to components/products/
  - Move ProductRecommender.tsx to components/products/
  - Move CatalogContent.tsx to components/products/
  - Update all imports
  - _Requirements: 1.1, 1.7_

- [ ] 3.7 Move RFQ components to rfq directory
  - Move RFQForm.tsx to components/rfq/
  - Move RFQTracking.tsx to components/rfq/
  - Update all imports
  - _Requirements: 1.1, 1.7_

- [ ] 3.8 Move remaining components to appropriate directories
  - Move ReportsManager.tsx to components/reports/ (create directory)
  - Keep FeatureIcon.tsx and TechnicalPattern.tsx in components/ (shared utilities)
  - Update all imports
  - _Requirements: 1.1, 1.7_

- [ ] 4. Enhanced Header with Authentication  
- [ ] 4.1 Add authentication state to Header
  - Import and use useAuth hook
  - Display user email when authenticated
  - Show loading state while auth initializes
  - _Requirements: 6.1, 6.2_

- [ ] 4.2 Add authenticated navigation items
  - Add "Account" link to navigation (visible when authenticated)
  - Add "Logout" button to navigation (visible when authenticated)
  - Style authenticated nav items
  - _Requirements: 3.7, 6.2_

- [ ] 4.3 Add unauthenticated navigation items
  - Add "Login" link (visible when not authenticated)
  - Add "Sign Up" link (visible when not authenticated)
  - Style unauthenticated nav items
  - _Requirements: 6.3_

- [ ] 4.4 Implement logout functionality
  - Add onClick handler for logout button
  - Call signOut from AuthContext
  - Redirect to homepage after logout
  - Show confirmation or loading state
  - _Requirements: 3.7_

- [ ] 4.5 Update mobile navigation
  - Add authenticated items to mobile menu
  - Add unauthenticated items to mobile menu
  - Ensure responsive behavior
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. Supabase Data Integration
- [ ] 5.1 Create categories API route
  - Create GET /api/categories route
  - Query categories from Supabase
  - Return categories with proper error handling
  - Add caching headers
  - _Requirements: 2.2, 2.8_

- [ ] 5.2 Create products API routes
  - Create GET /api/products route with filters
  - Create GET /api/products/[id] route
  - Query products from Supabase
  - Implement category and material filters
  - Add pagination support
  - _Requirements: 2.1, 2.8_

- [ ] 5.3 Create useCategories hook
  - Fetch categories from API
  - Handle loading and error states
  - Cache categories data
  - _Requirements: 2.2, 2.8_

- [ ] 5.4 Create useProducts hook
  - Fetch products from API with filters
  - Handle loading and error states
  - Implement pagination
  - Add filter parameters
  - _Requirements: 2.1, 2.8_

- [ ] 5.5 Update catalog page to use Supabase
  - Replace products.json import with useProducts hook
  - Replace categories.json import with useCategories hook
  - Update filtering logic
  - Test data fetching
  - _Requirements: 2.1, 2.2, 2.7_

- [ ] 5.6 Update homepage to use Supabase
  - Update FeaturedProducts to use useProducts hook
  - Update category links to use useCategories hook
  - Remove hardcoded category data
  - _Requirements: 2.1, 2.2, 2.7_

- [ ] 6. User Account Page
- [ ] 6.1 Create account page route
  - Create app/account/page.tsx
  - Add page metadata
  - Create basic layout structure
  - Add authentication check
  - _Requirements: 4.1_

- [ ] 6.2 Create ProfileSection component
  - Create components/account/ProfileSection.tsx
  - Display user email, company, phone
  - Add edit mode toggle
  - Implement form validation
  - _Requirements: 4.1, 4.5_

- [ ] 6.3 Implement profile editing
  - Add edit/save/cancel buttons
  - Create form inputs for company and phone
  - Call updateProfile on save
  - Show success/error messages
  - _Requirements: 4.5, 4.6_

- [ ] 6.4 Create useCADHistory hook
  - Fetch CAD history from API
  - Handle pagination
  - Implement filtering by status/format
  - Handle loading and error states
  - _Requirements: 4.2, 7.1_

- [ ] 6.5 Create CADHistorySection component
  - Create components/account/CADHistorySection.tsx
  - Display paginated CAD history list
  - Show prompt, format, status, date for each item
  - Add filter controls
  - _Requirements: 4.2, 4.3_

- [ ] 6.6 Implement CAD history item details
  - Add click handler to view details
  - Create modal or expanded view
  - Display full item information
  - Show 3D preview if available
  - _Requirements: 4.4_

- [ ] 6.7 Implement CAD history deletion
  - Add delete button to history items
  - Show confirmation dialog
  - Call DELETE API endpoint
  - Update list after deletion
  - _Requirements: 4.8_

- [ ] 6.8 Create AccountStatsSection component
  - Create components/account/AccountStatsSection.tsx
  - Fetch and display total CAD generations
  - Fetch and display total RFQ submissions
  - Display account creation date
  - Style stats cards
  - _Requirements: 4.7_

- [ ] 6.9 Integrate all sections in account page
  - Add ProfileSection to account page
  - Add CADHistorySection to account page
  - Add AccountStatsSection to account page
  - Implement responsive layout
  - _Requirements: 4.1_

- [ ] 7. Enhanced 3D Model Preview
- [ ] 7.1 Enhance CADPreview component size
  - Update component to use 600px minimum height on desktop
  - Update component to use 60% viewport width on generator page
  - Update component to use 400px minimum height on mobile
  - Ensure responsive behavior
  - _Requirements: 5.1, 5.2, 5.7_

- [ ] 7.2 Add interactive controls
  - Implement orbit controls (rotate around model)
  - Implement zoom controls (mouse wheel/pinch)
  - Implement pan controls (right-click drag/two-finger)
  - Add reset camera button
  - _Requirements: 5.3, 5.6_

- [ ] 7.3 Implement loading states
  - Add skeleton loader while model loads
  - Add progress indicator for large files
  - Show loading percentage if available
  - _Requirements: 5.4_

- [ ] 7.4 Implement error states
  - Display clear error messages
  - Add troubleshooting tips
  - Add retry button
  - Handle different error types
  - _Requirements: 5.5_

- [ ] 7.5 Optimize performance
  - Lazy load Three.js library
  - Optimize model rendering
  - Dispose of resources on unmount
  - Implement proper cleanup
  - _Requirements: 5.3_

- [ ] 8. Data Cleanup and Migration
- [ ] 8.1 Remove products.json dependencies
  - Remove all imports of products.json
  - Verify all components use Supabase
  - Delete products.json file
  - _Requirements: 2.7_

- [ ] 8.2 Remove categories.json dependencies
  - Remove all imports of categories.json
  - Verify all components use Supabase
  - Delete categories.json file
  - _Requirements: 2.7_

- [ ] 8.3 Clean up sample-data.ts
  - Remove unused sample data exports
  - Keep only UI demo data if needed
  - Update imports in components
  - _Requirements: 2.7_

- [ ] 9. Testing and Validation
- [ ] 9.1 Test authentication flow
  - Test signup with valid data
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test logout functionality
  - Test session persistence
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [ ] 9.2 Test route protection
  - Test accessing protected routes without auth
  - Test redirect to login with redirectTo parameter
  - Test accessing protected routes with auth
  - Test redirect from login/signup when authenticated
  - _Requirements: 3.8, 3.9_

- [ ] 9.3 Test account page functionality
  - Test profile display
  - Test profile editing
  - Test CAD history display
  - Test CAD history filtering
  - Test CAD history deletion
  - Test stats display
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8_

- [ ] 9.4 Test Supabase integration
  - Test products fetching
  - Test categories fetching
  - Test filtering and pagination
  - Test error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 9.5 Test 3D preview enhancements
  - Test preview size on desktop
  - Test preview size on mobile
  - Test interactive controls
  - Test loading states
  - Test error states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 9.6 Test responsive design
  - Test on mobile devices
  - Test on tablets
  - Test on desktop
  - Test navigation on all screen sizes
  - _Requirements: 6.4, 6.5_
