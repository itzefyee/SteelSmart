# Product Overview

SteelSmart is an AI-enhanced metal & steel parts marketplace built for engineers and manufacturers. The platform enables users to discover, analyze, and source metal components with intelligent AI assistance.

## Core Features

### 🤖 AI-Powered CAD Analysis
- **Real AI Integration**: Google Gemini 2.5 Flash for technical drawing analysis
- **Multi-Format Support**: PDF, PNG, JPG, STEP, STL files up to 10MB
- **Smart Fallback**: Mock analysis for demo when API not configured
- **Comprehensive Analysis**: Dimension extraction, material identification, tolerance analysis
- **Manufacturing Insights**: Manufacturability assessment and compliance checking
- **Alternative Suggestions**: AI-powered alternative product recommendations with standards compliance
- **Sample Drawings**: Pre-loaded technical drawings for testing

### 🎨 CAD Generation & 3D Visualization
- **Text-to-CAD**: Generate 3D CAD models from natural language descriptions using Zoo Dev API
- **ML Prompt Templates**: Pre-built best-practice prompts from Zoo Dev API for optimal generation
- **Multiple Formats**: Export to STEP, STL, OBJ, DXF, glTF formats
- **3D Preview**: Interactive Three.js-based model viewer with rotation, zoom, pan
- **Blueprint Hero**: Homepage features animated 3D model with blueprint aesthetic
- **OpenCascade.js**: WASM-based STEP file parsing and analysis
- **Generation History**: Track and manage all generated models with metadata
- **Download Management**: Easy access to generated files in multiple formats

### 📦 Comprehensive Product Catalog
- **Supabase Database**: PostgreSQL-backed product catalog with migrations
- **20+ Products**: Servo motors, structural steel, fasteners, custom brackets
- **4 Categories**: Robotic Components, Structural Steel, Fasteners, Custom Parts
- **Rich Product Data**: Specifications, pricing, compatibility, lead times
- **Visual Design**: Custom SVG product illustrations
- **Advanced Filtering**: Category, material, price range, text search
- **Liquid Glass UI**: Modern glass morphism design across all cards

### 💡 Smart Recommendation System
- **AI-Driven Matching**: Intelligent product suggestions based on extracted specs
- **Compatibility Analysis**: Cross-product compatibility recommendations
- **Confidence Scoring**: Reliability indicators for each suggestion
- **Alternative Products**: Standards-compliant alternatives when exact matches unavailable
- **Supplier Information**: Suggested suppliers, pricing estimates, lead times

### 📋 Request for Quote (RFQ)
- **Multi-Step Form**: Contact info, technical requirements, file upload
- **Form Validation**: Real-time error checking and user feedback
- **File Upload**: Support for technical drawings and specifications
- **Database Storage**: Persistent RFQ tracking with Supabase
- **Professional UI**: Clean, intuitive form design

### 🔐 Authentication & User Management
- **Supabase Auth**: Secure email/password authentication
- **User Profiles**: Company information and contact details
- **Row Level Security**: User-scoped data access with RLS policies
- **Protected Routes**: Secure access to user-specific features
- **Account Management**: Profile editing and settings

## User Workflows

### 1. CAD Analysis Workflow
```
User uploads drawing (PDF/PNG/JPG/STEP/STL)
    ↓
Google Gemini AI analyzes drawing
    ↓
Extract specs (dimensions, material, tolerances)
    ↓
Match against product catalog
    ↓
Display recommendations with confidence scores
    ↓
Show alternative suggestions if needed
    ↓
User can create RFQ or view product details
```

### 2. CAD Generation Workflow
```
User enters text description OR selects ML prompt template
    ↓
Zoo Dev API generates 3D model
    ↓
Server polls for completion (2-5 minutes)
    ↓
Display 3D preview with Three.js
    ↓
User can download in multiple formats
    ↓
Save to generation history
```

### 3. Product Discovery Workflow
```
Browse catalog (20+ products)
    ↓
Apply filters (category, material, price)
    ↓
View product details
    ↓
See compatibility recommendations
    ↓
Add to RFQ or contact supplier
```

### 4. Quote Request Workflow
```
Fill multi-step RFQ form
    ↓
Upload technical drawings/specs
    ↓
Submit to database
    ↓
Track status in account
    ↓
Receive quotes from suppliers
```

## Architecture & Data

### Authentication
- Supabase authentication with email/password
- Row Level Security (RLS) ensures users only access their own data
- Protected routes with middleware

### Data Storage
- **Products**: Supabase PostgreSQL with full-text search
- **CAD History**: User-scoped generation and analysis history
- **Technical Drawings**: Supabase Storage (private buckets)
- **RFQ Submissions**: Persistent tracking with file attachments

### Caching Strategy
- **React Query**: Client-side server state (5-10 min stale time)
- **Redis**: Server-side API caching (5-10 min TTL)
- **Zustand**: Client-side UI state (localStorage persistence)

### Performance
- 80-90% reduction in database queries via caching
- Sub-200ms response times for cached product queries
- Background refetching keeps data fresh
- Optimistic updates for instant feedback
