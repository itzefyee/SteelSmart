# Requirements Document

## Introduction

This document outlines the requirements for refactoring the SteelSmart application to improve its architecture, complete the Supabase migration, enhance authentication features, and improve the user experience. The refactoring will reorganize the codebase by feature domains, migrate all hardcoded data to Supabase, implement comprehensive authentication flows, create a user account management system, and enhance the 3D model preview experience.

## Glossary

- **SteelSmart Application**: The AI-powered metal and steel parts marketplace web application
- **Supabase**: The backend-as-a-service platform providing authentication, database, and storage
- **Feature-Based Architecture**: Code organization pattern where files are grouped by business feature rather than technical type
- **CAD History**: User's record of generated CAD models and their metadata
- **RLS (Row Level Security)**: Database security policies that restrict data access based on user identity
- **3D Model Preview**: Interactive Three.js-based visualization component for CAD files
- **Authentication Flow**: The complete user journey including signup, login, logout, and session management
- **User Profile**: Database record containing user account information and preferences

## Requirements

### Requirement 1: Feature-Based Code Organization

**User Story:** As a developer, I want the codebase organized by feature domains, so that related functionality is grouped together and easier to maintain.

#### Acceptance Criteria

1. WHEN the codebase is restructured, THE SteelSmart Application SHALL organize all CAD generation related files (components, API routes, hooks, utilities) into a single feature directory
2. WHEN the codebase is restructured, THE SteelSmart Application SHALL organize all CAD analysis related files into a single feature directory
3. WHEN the codebase is restructured, THE SteelSmart Application SHALL organize all product catalog related files into a single feature directory
4. WHEN the codebase is restructured, THE SteelSmart Application SHALL organize all RFQ (Request for Quote) related files into a single feature directory
5. WHEN the codebase is restructured, THE SteelSmart Application SHALL organize all authentication related files into a single feature directory
6. WHEN the codebase is restructured, THE SteelSmart Application SHALL maintain all existing functionality without breaking changes
7. WHEN imports are updated, THE SteelSmart Application SHALL use path aliases consistently across all feature modules

### Requirement 2: Supabase Data Integration

**User Story:** As a developer, I want all application functions to retrieve and store data using Supabase, so that the application uses the database infrastructure consistently.

#### Acceptance Criteria

1. WHEN the application loads product data, THE SteelSmart Application SHALL retrieve products from the Supabase products table instead of JSON files
2. WHEN the application loads category data, THE SteelSmart Application SHALL retrieve categories from the Supabase categories table
3. WHEN a user generates a CAD model, THE SteelSmart Application SHALL store the generation record in the Supabase cad_history table
4. WHEN a user analyzes a drawing, THE SteelSmart Application SHALL store the analysis result in the Supabase drawing_analyses table
5. WHEN a user submits an RFQ, THE SteelSmart Application SHALL store the submission in the Supabase rfq_submissions table
6. WHEN files are uploaded, THE SteelSmart Application SHALL store files in appropriate Supabase Storage buckets
7. WHEN data is accessed, THE SteelSmart Application SHALL respect Row Level Security policies to ensure users only access their own data
8. WHEN existing functions use hardcoded sample data arrays, THE SteelSmart Application SHALL refactor them to use Supabase client queries instead
9. WHEN the categories table does not exist, THE SteelSmart Application SHALL create a migration to add the categories table with id, name, description, and icon fields

### Requirement 3: Enhanced Authentication System

**User Story:** As a user, I want a complete authentication system with login, logout, and session management, so that I can securely access my account and data.

#### Acceptance Criteria

1. WHEN a user navigates to the login page, THE SteelSmart Application SHALL display a form with email and password fields
2. WHEN a user submits valid credentials, THE SteelSmart Application SHALL authenticate the user and redirect to the homepage
3. WHEN a user submits invalid credentials, THE SteelSmart Application SHALL display an error message without redirecting
4. WHEN a user navigates to the signup page, THE SteelSmart Application SHALL display a registration form with email, password, company, and phone fields
5. WHEN a user completes signup, THE SteelSmart Application SHALL create a user account and profile record in Supabase
6. WHEN an authenticated user is on any page, THE SteelSmart Application SHALL display a logout button in the navigation
7. WHEN a user clicks logout, THE SteelSmart Application SHALL terminate the session and redirect to the login page
8. WHEN an unauthenticated user attempts to access protected routes, THE SteelSmart Application SHALL redirect to the login page
9. WHEN a user's session expires, THE SteelSmart Application SHALL prompt for re-authentication

### Requirement 4: User Account Management Page

**User Story:** As a user, I want a dedicated account page where I can view my profile, CAD generation history, and manage settings, so that I can track my activity and customize my experience.

#### Acceptance Criteria

1. WHEN a user navigates to the account page, THE SteelSmart Application SHALL display the user's email, company name, and phone number
2. WHEN a user is on the account page, THE SteelSmart Application SHALL display a complete list of the user's CAD generation history with timestamps
3. WHEN a user views their CAD history, THE SteelSmart Application SHALL display the prompt, format, status, and generation date for each item
4. WHEN a user clicks on a CAD history item, THE SteelSmart Application SHALL display detailed information including the 3D model preview
5. WHEN a user is on the account page, THE SteelSmart Application SHALL provide options to update profile information
6. WHEN a user updates their profile, THE SteelSmart Application SHALL save changes to the Supabase profiles table
7. WHEN a user is on the account page, THE SteelSmart Application SHALL display account statistics including total CAD generations and RFQ submissions
8. WHEN a user deletes a CAD history item, THE SteelSmart Application SHALL remove the record from the database and delete associated files from storage

### Requirement 5: Enhanced 3D Model Preview

**User Story:** As a user, I want a larger and more prominent 3D model preview, so that I can better inspect and evaluate CAD models.

#### Acceptance Criteria

1. WHEN a 3D model is displayed, THE SteelSmart Application SHALL render the preview at a minimum height of 600 pixels on desktop devices
2. WHEN a 3D model is displayed, THE SteelSmart Application SHALL render the preview at a minimum height of 400 pixels on mobile devices
3. WHEN a user interacts with the 3D preview, THE SteelSmart Application SHALL support rotation, zoom, and pan controls
4. WHEN a 3D model loads, THE SteelSmart Application SHALL display a loading indicator until rendering is complete
5. WHEN a 3D model fails to load, THE SteelSmart Application SHALL display a clear error message with troubleshooting guidance
6. WHEN a 3D model is displayed, THE SteelSmart Application SHALL provide controls to reset the camera view to default position
7. WHEN a 3D model is displayed on the CAD generator page, THE SteelSmart Application SHALL allocate at least 60% of the viewport width to the preview

### Requirement 6: Navigation and User Experience

**User Story:** As a user, I want intuitive navigation with clear indicators of my authentication status, so that I can easily access features and understand my session state.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE SteelSmart Application SHALL display the user's email or name in the navigation header
2. WHEN a user is authenticated, THE SteelSmart Application SHALL display a link to the account page in the navigation
3. WHEN a user is unauthenticated, THE SteelSmart Application SHALL display login and signup links in the navigation
4. WHEN a user navigates between pages, THE SteelSmart Application SHALL maintain authentication state without requiring re-login
5. WHEN a user is on a protected page, THE SteelSmart Application SHALL display appropriate navigation options for authenticated users
6. WHEN a user hovers over navigation items, THE SteelSmart Application SHALL provide visual feedback indicating interactivity

### Requirement 7: Data Persistence and Synchronization

**User Story:** As a user, I want my data automatically saved and synchronized with the backend, so that I never lose my work or history.

#### Acceptance Criteria

1. WHEN a user generates a CAD model, THE SteelSmart Application SHALL save the generation to the database within 2 seconds of completion
2. WHEN a user analyzes a drawing, THE SteelSmart Application SHALL save the analysis result to the database immediately after processing
3. WHEN a user submits an RFQ, THE SteelSmart Application SHALL save the submission to the database and confirm success to the user
4. WHEN a user uploads a file, THE SteelSmart Application SHALL upload to Supabase Storage and store the file path in the database
5. WHEN a database operation fails, THE SteelSmart Application SHALL display an error message and provide retry options
6. WHEN a user's data is modified, THE SteelSmart Application SHALL reflect changes in the UI within 1 second
