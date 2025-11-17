# Metalyze AI Marketplace

An AI-enhanced metal & steel parts marketplace built with Next.js 16, featuring advanced CAD capabilities powered by Google Gemini AI and Zoo Dev API. A comprehensive platform for engineers and manufacturers to discover, analyze, generate, and source metal & steel components with intelligent AI assistance.

## Features

### 🤖 **AI-Powered CAD Analysis**
- **Real AI Integration**: Google Gemini 2.5 Flash for technical drawing analysis
- **Multi-Format Support**: PDF, PNG, JPG, STEP, STL files up to 10MB
- **Smart Fallback**: Mock analysis for demo when API not configured
- **Comprehensive Analysis**: Dimension extraction, material identification, tolerance analysis
- **Manufacturing Insights**: Manufacturability assessment and compliance checking
- **Alternative Suggestions**: AI-powered alternative product recommendations with standards compliance
- **Sample Drawings**: Pre-loaded technical drawings for testing

### 🎨 **CAD Generation & 3D Visualization**
- **Text-to-CAD**: Generate 3D CAD models from natural language descriptions using Zoo Dev API
- **Multiple Formats**: Export to STEP, STL, OBJ, DXF, glTF formats
- **3D Preview**: Interactive Three.js-based model viewer with rotation, zoom, pan
- **OpenCascade.js**: WASM-based STEP file parsing and analysis
- **Generation History**: Track and manage all generated models with metadata
- **Download Management**: Easy access to generated files in multiple formats

### 🔐 **Authentication & User Management**
- **Supabase Auth**: Secure email/password authentication
- **User Profiles**: Company information and contact details
- **Row Level Security**: User-scoped data access with RLS policies
- **Protected Routes**: Secure access to user-specific features
- **Account Management**: Profile editing and settings

### 📦 **Comprehensive Product Catalog**
- **Supabase Database**: PostgreSQL-backed product catalog with migrations
- **20+ Products**: Servo motors, structural steel, fasteners, custom brackets
- **4 Categories**: Robotic Components, Structural Steel, Fasteners, Custom Parts
- **Rich Product Data**: Specifications, pricing, compatibility, lead times
- **Visual Design**: Custom SVG product illustrations
- **Advanced Filtering**: Category, material, price range, text search

### 💡 **Smart Recommendation System**
- **AI-Driven Matching**: Intelligent product suggestions based on extracted specs
- **Compatibility Analysis**: Cross-product compatibility recommendations
- **Confidence Scoring**: Reliability indicators for each suggestion
- **Alternative Products**: Standards-compliant alternatives when exact matches unavailable
- **Supplier Information**: Suggested suppliers, pricing estimates, lead times

### 📋 **Request for Quote (RFQ)**
- **Multi-Step Form**: Contact info, technical requirements, file upload
- **Form Validation**: Real-time error checking and user feedback
- **File Upload**: Support for technical drawings and specifications
- **Database Storage**: Persistent RFQ tracking with Supabase
- **Professional UI**: Clean, intuitive form design

### 📊 **Reports & Analytics**
- **CAD Analysis Reports**: Detailed manufacturability and compliance reports
- **Generation History**: Track all CAD generations with timestamps
- **User Activity**: Monitor analysis and generation patterns

### 📱 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Professional Branding**: Consistent Metalyze logo and colors
- **Clean Typography**: Inter font with proper hierarchy
- **Accessibility**: Proper alt texts, semantic HTML, keyboard navigation
- **Loading States**: Smooth transitions and feedback

## Tech Stack

### **Core Technologies**
- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5+ with strict type checking
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **Runtime**: React 19.1.0 with modern hooks and patterns

### **Backend & Database**
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: @supabase/auth-helpers-nextjs for secure auth
- **Storage**: Supabase Storage for file uploads
- **Migrations**: SQL migrations for schema management

### **AI & External APIs**
- **CAD Analysis**: Google Gemini 2.5 Flash API (@google/generative-ai)
- **CAD Generation**: Zoo Dev API (@kittycad/lib) for text-to-CAD
- **Standards Database**: Built-in compliance and standards checking
- **Manufacturing Analysis**: AI-powered manufacturability assessment

### **3D Visualization**
- **Three.js**: 3D rendering engine for CAD model preview
- **OpenCascade.js**: WASM-based CAD file parsing (STEP format)
- **File Handling**: React Dropzone for drag-and-drop uploads

### **Testing**
- **Test Runner**: Vitest with jsdom environment
- **Component Testing**: @testing-library/react
- **Test UI**: @vitest/ui for visual test interface
- **Coverage**: Built-in coverage reporting

### **Development & Deployment**
- **Package Manager**: npm with optimized dependencies
- **Linting**: ESLint 9 with Next.js configuration
- **Build Tool**: Webpack (configured for WASM support)
- **Deployment**: Vercel-optimized with PWA support
- **Environment**: Node.js 18+ with modern ES features

## Getting Started

### Prerequisites

- **Node.js 18.0+**: Required for Next.js 16 and modern JavaScript features
- **npm**: Package manager (included with Node.js)
- **Supabase Account**: Required for database and authentication (free tier available)
- **Google Gemini API Key**: Optional for real AI analysis (free tier available)
- **Zoo Dev API Token**: Optional for CAD generation (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Metalyze
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
# Create .env.local file (for local development only)
# Copy from .env.example if available
```

**Required Environment Variables:**
```bash
# Supabase (Required for auth & database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Application
NEXTAUTH_URL=http://localhost:3000
```

**Optional API Keys:**
```bash
# Google Gemini AI (Optional - fallback available)
GEMINI_API_KEY=your_gemini_api_key_here

# Zoo Dev API (Optional - for CAD generation)
ZOO_API_TOKEN=your_zoo_dev_token_here
```

**Getting API Keys:**
- **Supabase**: Visit [supabase.com](https://supabase.com), create project, get keys from Settings > API
- **Gemini**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Zoo Dev**: Visit [zoo.dev](https://zoo.dev) and sign up for API access

**Security Note**: 
- Never commit `.env` files to version control
- For production, use dedicated secrets management (see Security section below)
- The app works with fallbacks when optional API keys are not configured

4. Set up Supabase database:
```bash
# Run migrations to create tables
# Visit your Supabase project dashboard > SQL Editor
# Run the migration files in supabase/migrations/ in order
```

5. Migrate product data (optional):
```bash
npx tsx scripts/migrate-products.ts
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 **Quick Start Guide**

1. **Sign Up/Login**: Create an account at `/signup` or login at `/login`
2. **Homepage**: Explore featured products and AI tools showcase
3. **CAD Generator**: Visit `/cad-generator` to generate 3D models from text
4. **CAD Analyzer**: Visit `/cad-analyzer` to analyze technical drawings
5. **Product Catalog**: Browse `/catalog` for 20+ products across 4 categories
6. **Product Recommender**: Visit `/product-recommender` for AI-powered suggestions
7. **RFQ Form**: Submit quote requests at `/rfq` with technical requirements
8. **Account**: Manage your profile and view history at `/account`

## 📁 **Project Structure**

```
Metalyze/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── api/                     # API Routes
│   │   │   ├── analyze-drawing/    # Gemini AI CAD analysis
│   │   │   ├── generate-cad/       # Zoo Dev CAD generation
│   │   │   ├── recommendations/    # Product matching
│   │   │   └── submit-rfq/        # Quote submissions
│   │   ├── account/                # User account management
│   │   ├── catalog/                # Product catalog
│   │   │   └── [id]/              # Dynamic product details
│   │   ├── cad-analyzer/           # CAD analysis page
│   │   ├── cad-generator/          # CAD generation page
│   │   ├── cad-preview-demo/       # 3D preview demo
│   │   ├── product-recommender/    # AI recommendations
│   │   ├── reports/                # Analysis reports
│   │   ├── rfq/                    # Request for Quote
│   │   ├── login/                  # Authentication
│   │   ├── signup/                 # User registration
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Homepage
│   │   └── globals.css             # Global styles
│   ├── components/                  # React Components
│   │   ├── ui/                     # Base UI components
│   │   ├── auth/                   # Auth components
│   │   ├── cad/                    # CAD-related components
│   │   ├── layout/                 # Layout components
│   │   ├── products/               # Product components
│   │   ├── reports/                # Report components
│   │   └── rfq/                    # RFQ components
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useCADAnalysis.ts       # CAD analysis hook
│   │   ├── useCADGeneration.ts     # CAD generation hook
│   │   ├── useCADHistory.ts        # History management
│   │   ├── useFileUpload.ts        # File upload handling
│   │   ├── useProducts.ts          # Product data hook
│   │   └── useCategories.ts        # Category data hook
│   ├── lib/                         # Utility Libraries
│   │   ├── supabase.ts             # Supabase client
│   │   ├── supabase-server.ts      # Server-side Supabase
│   │   ├── gemini-client.ts        # Google Gemini API
│   │   ├── zoo-client.ts           # Zoo Dev API
│   │   ├── cad-parser.ts           # OpenCascade.js parser
│   │   ├── cad-manufacturing-analyzer.ts
│   │   ├── alternative-product-suggester.ts
│   │   ├── compliance-checker.ts
│   │   ├── standards-database.ts
│   │   ├── product-matcher.ts      # Recommendation engine
│   │   ├── logger.ts               # Logging utility
│   │   └── utils.ts                # Helper functions
│   ├── types/                       # TypeScript Definitions
│   │   └── index.ts                # All interfaces & types
│   ├── data/                        # JSON Data (legacy)
│   │   ├── products.json
│   │   ├── categories.json
│   │   └── sample-data.ts
│   └── __tests__/                   # Test files
│       ├── components/
│       └── lib/
├── supabase/                        # Supabase Configuration
│   ├── migrations/                  # Database migrations
│   │   ├── 20250115000000_initial_schema.sql
│   │   ├── 20250116000000_add_categories_table.sql
│   │   └── 20250116000000_make_products_public.sql
│   └── storage_setup.sql           # Storage bucket setup
├── public/                          # Static Assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-white.svg
│   │   ├── products/               # Product illustrations
│   │   └── *-cad-preview.svg
│   ├── sample-drawings/            # Demo CAD files
│   ├── favicon.svg
│   └── site.webmanifest
├── scripts/                         # Utility Scripts
│   ├── migrate-products.ts         # Product migration
│   └── fetch-ml-prompts.ts
├── documentation/                   # Project Documentation
│   ├── Architecture/               # Architecture docs
│   ├── CAD Generation/             # CAD generation docs
│   ├── CAD Preview/                # 3D preview docs
│   ├── Alternative Products/       # Alternative suggestions
│   ├── COMPONENTS.md               # Component documentation
│   ├── PRD-CAD.md                  # Product requirements
│   └── MIGRATION_GUIDE.md
└── Configuration Files
    ├── package.json                # Dependencies & scripts
    ├── tsconfig.json               # TypeScript config
    ├── tailwind.config.js          # Design system
    ├── next.config.js              # Next.js + WASM config
    ├── vitest.config.ts            # Test configuration
    ├── vitest.setup.ts             # Test setup
    └── .env.local                  # Environment variables
```

## 🔧 **Key Components & Systems**

### 🎨 **CAD Generator** (`/cad-generator`)
- **Text-to-CAD**: Natural language to 3D model conversion using Zoo Dev API
- **Multiple Formats**: Export to STEP, STL, OBJ, DXF, glTF
- **Real-time Progress**: Live generation status updates
- **Generation History**: Track all generated models with metadata
- **Download Management**: Easy access to all generated files
- **Template Support**: Pre-built templates for common components

### 🤖 **CAD Analyzer** (`/cad-analyzer`)
- **AI Analysis**: Google Gemini 2.5 Flash for technical drawing analysis
- **File Support**: PDF, PNG, JPG, STEP, STL up to 10MB with drag-and-drop
- **Comprehensive Analysis**: Dimensions, materials, tolerances, manufacturability
- **Standards Compliance**: Check against industry standards (ASTM, ISO, ASME)
- **Alternative Suggestions**: AI-powered alternative product recommendations
- **Manufacturing Insights**: Feasibility assessment and cost estimation
- **Report Generation**: Detailed analysis reports with recommendations

### 🔮 **3D CAD Preview** (`/cad-preview-demo`)
- **Interactive Viewer**: Three.js-based 3D model visualization
- **File Support**: STEP, STL, OBJ, glTF formats
- **OpenCascade.js**: WASM-based STEP file parsing
- **Controls**: Rotate, zoom, pan with mouse/touch
- **Analysis**: Face count, edge count, bounding box display
- **Performance**: Optimized rendering for large models

### 💡 **Product Recommender** (`/product-recommender`)
- **AI-Driven Matching**: Intelligent product suggestions based on specifications
- **Compatibility Analysis**: Cross-product compatibility scoring
- **Confidence Scoring**: Reliability indicators for each suggestion
- **Alternative Products**: Standards-compliant alternatives with supplier info
- **Contextual Reasoning**: Detailed explanations for recommendations
- **Supplier Information**: Suggested suppliers, pricing, lead times

### 📦 **Product Catalog** (`/catalog`)
- **Supabase Database**: PostgreSQL-backed product catalog
- **20+ Products**: Comprehensive inventory across 4 categories
- **Rich Data**: Specifications, materials, pricing, compatibility, lead times
- **Advanced Filtering**: Category, material, price range, text search
- **Product Pages**: Individual detail pages with full specs
- **Mobile Optimized**: Responsive grid layouts and touch-friendly interfaces

### 📋 **RFQ System** (`/rfq`)
- **Multi-Step Workflow**: Contact → Requirements → Files → Review → Submit
- **Smart Validation**: Real-time form validation with helpful error messages
- **File Upload**: Technical drawings and specification documents
- **Database Storage**: Persistent RFQ tracking with Supabase
- **User Association**: RFQs linked to authenticated users
- **Progress Tracking**: Clear step indicators and navigation

### 🔐 **Authentication System**
- **Supabase Auth**: Secure email/password authentication
- **Protected Routes**: Middleware-based route protection
- **User Profiles**: Company information and contact details
- **Row Level Security**: User-scoped data access with RLS policies
- **Account Management**: Profile editing at `/account`

### 📊 **Reports & History**
- **CAD History**: Track all CAD generations and analyses
- **Analysis Reports**: Detailed manufacturability and compliance reports
- **User Activity**: Monitor patterns and usage
- **Export Options**: Download reports and generated files

## 🌐 **API Endpoints**

### **CAD Generation**
- `POST /api/generate-cad` - Generate 3D CAD models from text
  - **Input**: `{ prompt: string, format: 'step' | 'stl' | 'obj' | 'dxf' | 'gltf' }`
  - **Processing**: Zoo Dev API integration with progress tracking
  - **Output**: Generated model URL, metadata, download links

### **CAD Analysis**
- `POST /api/analyze-drawing` - Analyze technical drawings with AI
  - **Input**: FormData with file (PDF/PNG/JPG/STEP/STL)
  - **AI Processing**: Google Gemini vision analysis + OpenCascade.js parsing
  - **Output**: Extracted specs, manufacturability assessment, product recommendations, alternative suggestions

### **Product Recommendations**
- `GET /api/recommendations?productId={id}` - Get compatible products
  - **Logic**: Compatibility matrix + category matching
  - **Output**: Scored recommendations with reasoning

### **Alternative Suggestions**
- `POST /api/alternative-suggestions` - Get alternative product suggestions
  - **Input**: Specifications and requirements
  - **Processing**: AI-powered matching with standards compliance
  - **Output**: Alternative products with supplier info and standards

### **Quote Requests**
- `POST /api/submit-rfq` - Submit request for quote
  - **Input**: Contact info, requirements, files
  - **Processing**: Validation + Supabase storage
  - **Output**: Confirmation + RFQ ID

### **Authentication**
- Handled by Supabase Auth with Next.js middleware
- Protected routes automatically redirect to `/login`

## 🔐 **Security & Environment**

### **Environment Variables**

**Required:**
```bash
# Supabase (Required for auth & database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Application
NEXTAUTH_URL=http://localhost:3000
```

**Optional:**
```bash
# Google Gemini AI (Optional - fallback available)
GEMINI_API_KEY=your_gemini_api_key_here

# Zoo Dev API (Optional - for CAD generation)
ZOO_API_TOKEN=your_zoo_dev_token_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Security Best Practices**

⚠️ **CRITICAL**: Never commit `.env` files to version control or read/modify them programmatically in production.

**Secrets Management:**
- **Development**: Use `.env.local` for local development only (already in `.gitignore`)
- **Production**: Use dedicated secrets management solutions:
  - **Vercel**: Environment Variables in project settings
  - **AWS**: AWS Secrets Manager or Parameter Store
  - **Azure**: Azure Key Vault
  - **GCP**: Secret Manager
  - **Docker**: Docker Secrets or Kubernetes Secrets
  - **Self-hosted**: HashiCorp Vault or similar solutions

**Why This Matters:**
- `.env` files can accidentally be committed to repositories
- Secrets management solutions provide encryption, rotation, and audit logs
- Environment-specific configurations are easier to manage
- Reduces risk of credential exposure in logs or error messages

## 🛠️ **Development**

### **Available Scripts**
```bash
# Development server with webpack (WASM support)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Code linting with ESLint 9
npm run lint

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Test coverage
npm run test:coverage

# Migrate products to Supabase
npx tsx scripts/migrate-products.ts
```

### **Development Features**
- **Hot Reload**: Instant updates with webpack
- **TypeScript**: Full type checking and IntelliSense
- **ESLint**: Code quality and consistency checking
- **Vitest**: Fast unit and integration testing
- **WASM Support**: OpenCascade.js for CAD file parsing
- **Path Aliases**: Use `@/` for imports from `src/`
- **Responsive Testing**: Built-in mobile viewport testing
- **API Testing**: Test all endpoints locally with Supabase local dev

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. **Connect Repository**: Link your GitHub/GitLab repo to Vercel
2. **Environment Variables**: Add all required environment variables in Vercel dashboard:
   - Supabase credentials (required)
   - API keys for Gemini and Zoo Dev (optional)
3. **Auto Deploy**: Automatic deployments on push to main branch
4. **Edge Functions**: Optimized API routes with edge runtime
5. **PWA Support**: Includes web manifest and service worker ready

### **Other Platforms**
- **Netlify**: Full Next.js 15 support with edge functions
- **Railway**: One-click deployment with environment management
- **Docker**: Dockerfile ready for containerized deployment

### **Performance Optimizations**
- **Bundle Analysis**: Built-in bundle analyzer
- **Image Optimization**: Next.js automatic image optimization
- **PWA Ready**: Web app manifest and offline support
- **SEO Optimized**: Complete meta tags and Open Graph

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the Repository**: Create your own copy
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow TypeScript and ESLint standards
4. **Test Locally**: Ensure everything works with `npm run dev`
5. **Submit Pull Request**: Describe your changes clearly

### **Contribution Guidelines**
- **TypeScript**: All new code must be properly typed
- **Components**: Follow existing component patterns in `src/components/`
- **Styling**: Use Tailwind CSS classes consistently
- **Testing**: Write tests for new features using Vitest
- **Documentation**: Update README and component docs if adding new features
- **Database**: Create migrations for schema changes in `supabase/migrations/`
- **Security**: Never commit `.env` files or sensitive credentials

## 📄 **License**

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 📞 **Support & Contact**

**Metalyze Team**
- **Email**: [info@metalyze.com](mailto:info@metalyze.com)
- **Website**: [metalyze.com](https://metalyze.com)
- **Business Hours**: Monday-Friday, 9AM-6PM EST

## 🗺️ **Roadmap**

### **Phase 1: Core Platform (✅ Complete)**
- [x] AI-powered CAD analysis with Google Gemini
- [x] Text-to-CAD generation with Zoo Dev API
- [x] 3D model viewer with Three.js and OpenCascade.js
- [x] Supabase authentication and database
- [x] Comprehensive product catalog (20+ products)
- [x] Smart recommendation engine with alternatives
- [x] Manufacturing analysis and compliance checking
- [x] Professional UI/UX with responsive design
- [x] RFQ system with database storage
- [x] User account management

### **Phase 2: Enhanced Features (🚧 In Progress)**
- [x] **Database Integration**: Supabase PostgreSQL with migrations
- [x] **User Authentication**: Supabase Auth with email/password
- [x] **3D Model Viewer**: Three.js-based CAD preview
- [x] **CAD Generation**: Zoo Dev API integration
- [ ] **Advanced Search**: Full-text search with Supabase
- [ ] **Real-time Features**: Supabase Realtime for live updates
- [ ] **Payment Integration**: Stripe for secure transactions
- [ ] **Email Notifications**: Transactional emails for RFQs

### **Phase 3: Advanced AI (🔮 Planned)**
- [ ] **Enhanced CAD Formats**: DWG, IGES, Parasolid support
- [ ] **ML Recommendations**: Machine learning-enhanced suggestions
- [ ] **Automated Quoting**: AI-powered price estimation
- [ ] **Batch Processing**: Multiple file analysis
- [ ] **Custom Training**: Fine-tuned models for specific industries
- [ ] **Mobile App**: React Native cross-platform app

### **Phase 4: Enterprise (🏢 Vision)**
- [ ] **Multi-tenant Architecture**: White-label solutions
- [ ] **API Marketplace**: Third-party integrations
- [ ] **Advanced Analytics**: Business intelligence dashboard
- [ ] **Supply Chain Integration**: ERP system connections
- [ ] **Team Collaboration**: Shared workspaces and projects
- [ ] **Audit Logs**: Comprehensive activity tracking

---

## 📚 **Documentation**

Comprehensive documentation is available in the `/documentation` directory:

- **Architecture**: System design and patterns
- **Components**: Component documentation and usage
- **CAD Generation**: Text-to-CAD implementation details
- **CAD Preview**: 3D visualization implementation
- **Alternative Products**: Alternative suggestion system
- **Migration Guide**: Database migration instructions
- **PRD**: Product requirements and specifications

## 🌟 **Acknowledgments**

- **Google AI**: For the powerful Gemini 2.5 Flash API
- **Zoo Dev**: For the text-to-CAD generation API
- **Supabase**: For authentication, database, and storage
- **Three.js**: For 3D visualization capabilities
- **OpenCascade.js**: For WASM-based CAD file parsing
- **Vercel**: For excellent Next.js hosting and deployment
- **Tailwind CSS**: For the utility-first CSS framework
- **Next.js Team**: For the amazing React framework
- **TypeScript**: For type safety and developer experience

**Built with ❤️ for engineers and manufacturers worldwide.**