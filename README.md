# SteelSmart AI Marketplace

An AI-enhanced metal & steel parts marketplace built with Next.js 15, featuring CAD drawing analysis powered by Google Gemini AI. A comprehensive platform for engineers and manufacturers to discover, analyze, and source metal & steel components with intelligent AI assistance.

## Features

### 🤖 **AI-Powered CAD Analysis**
- **Real AI Integration**: Google Gemini 1.5 Flash for technical drawing analysis
- **Multi-Format Support**: PDF, PNG, JPG files up to 10MB
- **Smart Fallback**: Mock analysis for demo when API not configured
- **Dual Experience**: Quick homepage analyzer + comprehensive full-page analyzer
- **Sample Drawings**: Pre-loaded technical drawings for testing

### 📦 **Comprehensive Product Catalog**
- **20+ Products**: Servo motors, structural steel, fasteners, custom brackets
- **4 Categories**: Robotic Components, Structural Steel, Fasteners, Custom Parts
- **Rich Product Data**: Specifications, pricing, compatibility, lead times
- **Visual Design**: Custom SVG product illustrations
- **Clickable Categories**: Direct navigation from homepage

### 💡 **Smart Recommendation System**
- **AI-Driven Matching**: Intelligent product suggestions based on extracted specs
- **Compatibility Analysis**: "You might also need" recommendations
- **Confidence Scoring**: Reliability indicators for each suggestion
- **Limited Display**: Shows top 3 recommendations to avoid UI clutter
- **Fallback Logic**: Ensures recommendations even with partial matches

### 📋 **Request for Quote (RFQ)**
- **Multi-Step Form**: Contact info, technical requirements, file upload
- **Form Validation**: Real-time error checking and user feedback
- **File Upload**: Support for technical drawings and specifications
- **Email Integration**: Mailto links for MVP (expandable to SMTP)
- **Professional UI**: Clean, intuitive form design

### 🔍 **Advanced Search & Filtering**
- **Category Filtering**: Filter by robotic, structural, fasteners, custom
- **Material Search**: Find products by steel grades, aluminum, etc.
- **Price Range**: Budget-based filtering
- **Text Search**: Search across names, descriptions, specifications
- **Real-time Results**: Instant filtering as you type

### 📱 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Professional Branding**: Consistent SteelSmart logo and colors
- **Clean Typography**: Inter font with proper hierarchy
- **Accessibility**: Proper alt texts, semantic HTML, keyboard navigation
- **Loading States**: Smooth transitions and feedback

## Tech Stack

### **Core Technologies**
- **Framework**: Next.js 15.4.5 with App Router & Turbopack
- **Language**: TypeScript 5+ with strict type checking
- **Styling**: Tailwind CSS 3.4.0 with custom design system
- **Runtime**: React 19.1.0 with modern hooks and patterns

### **AI & Data**
- **AI Integration**: Google Gemini 1.5 Flash API (@google/generative-ai)
- **Data Storage**: JSON-based catalog (ready for database migration)
- **File Handling**: React Dropzone for uploads
- **Image Processing**: Custom SVG illustrations and placeholders

### **Development & Deployment**
- **Package Manager**: npm with optimized dependencies
- **Linting**: ESLint 9 with Next.js configuration
- **Build Tool**: Next.js built-in bundler with Turbopack
- **Deployment**: Vercel-optimized with PWA support
- **Environment**: Node.js 18+ with modern ES features

## Getting Started

### Prerequisites

- **Node.js 18.0+**: Required for Next.js 15 and modern JavaScript features
- **npm**: Package manager (included with Node.js)
- **Google Gemini API Key**: Optional for real AI analysis (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steal_smart
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables (optional):
```bash
# Create environment file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
```

**Getting a Gemini API Key:**
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Sign in with your Google account
- Create a new API key
- Add it to your `.env.local` file

**Note**: The app works perfectly without an API key using intelligent mock analysis for demos.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 **Quick Start Guide**

1. **Homepage**: Explore the hero section and featured products
2. **CAD Analyzer**: Try the sample drawings (servo motor, bracket, steel beam)
3. **Product Catalog**: Browse 20+ products across 4 categories
4. **Product Details**: Click any product for full specifications
5. **RFQ Form**: Submit quote requests with technical requirements
6. **Full CAD Analyzer**: Visit `/cad-analyzer` for comprehensive analysis

## 📁 **Project Structure**

```
steal_smart/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── api/                 # API Routes
│   │   │   ├── analyze-drawing/ # Gemini AI integration
│   │   │   ├── recommendations/ # Product matching
│   │   │   └── submit-rfq/     # Quote submissions
│   │   ├── catalog/            # Product pages
│   │   │   └── [id]/          # Dynamic product details
│   │   ├── cad-analyzer/       # Full CAD analyzer page
│   │   ├── rfq/               # Request for Quote
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles + design system
│   ├── components/            # React Components
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx    # Styled button component
│   │   │   ├── Input.tsx     # Form input component
│   │   │   ├── Modal.tsx     # Modal dialog
│   │   │   └── LoadingSpinner.tsx
│   │   ├── CADAnalyzer.tsx        # Homepage analyzer
│   │   ├── CADAnalyzerFull.tsx    # Full-page analyzer
│   │   ├── ProductCard.tsx        # Product display cards
│   │   ├── ProductFilter.tsx      # Catalog filtering
│   │   ├── ProductRecommendations.tsx
│   │   ├── RFQForm.tsx           # Multi-step quote form
│   │   ├── Header.tsx            # Navigation + logo
│   │   ├── Footer.tsx            # Footer + white logo
│   │   └── Hero.tsx              # Homepage hero
│   ├── data/                     # JSON Data Store
│   │   ├── products.json         # 20+ product catalog
│   │   └── categories.json       # Category definitions
│   ├── lib/                      # Utility Libraries
│   │   ├── gemini-client.ts      # Google Gemini API
│   │   ├── product-matcher.ts    # AI recommendation engine
│   │   └── utils.ts              # Helper functions
│   └── types/                    # TypeScript Definitions
│       └── index.ts              # All interfaces & types
├── public/                       # Static Assets
│   ├── images/
│   │   ├── logo.svg             # Main SteelSmart logo
│   │   ├── logo-white.svg       # White logo for dark backgrounds
│   │   ├── products/            # Product SVG illustrations
│   │   └── *-cad-preview.svg    # Sample drawing previews
│   ├── sample-drawings/         # Demo CAD files
│   ├── favicon.svg              # Custom SteelSmart favicon
│   └── site.webmanifest        # PWA manifest
└── Configuration Files
    ├── package.json             # Dependencies & scripts
    ├── tsconfig.json           # TypeScript config
    ├── tailwind.config.js      # Design system config
    ├── next.config.js          # Next.js optimization
    └── .env.local              # Environment variables
```

## 🔧 **Key Components**

### 🤖 **CAD Analyzer System**
- **Dual Interface**: Homepage quick analyzer + full-page comprehensive analyzer
- **File Support**: PDF, PNG, JPG up to 10MB with drag-and-drop
- **Real AI**: Google Gemini 1.5 Flash for actual technical drawing analysis
- **Smart Fallback**: Intelligent mock analysis when API not configured
- **Sample Drawings**: Pre-loaded servo motor, bracket, and steel beam examples
- **Results Flow**: Redirects to full analyzer page to avoid UI clutter

### 📦 **Product Catalog System**
- **Comprehensive Inventory**: 20+ products across 4 main categories
- **Rich Data**: Specifications, materials, pricing, compatibility, lead times
- **Visual Design**: Custom SVG illustrations for all products
- **Smart Filtering**: Category, material, price range, text search
- **Product Pages**: Individual detail pages with full specs and recommendations
- **Mobile Optimized**: Responsive grid layouts and touch-friendly interfaces

### 💡 **AI Recommendation Engine**
- **Specification Matching**: Analyzes extracted specs against product database
- **Compatibility Logic**: Cross-references product compatibility matrices
- **Confidence Scoring**: Provides reliability indicators for each suggestion
- **Intelligent Fallback**: Ensures recommendations even with partial matches
- **Limited Display**: Shows top 3 recommendations to maintain clean UI
- **Contextual Reasoning**: Explains why products are recommended

### 📋 **RFQ (Request for Quote) System**
- **Multi-Step Workflow**: Contact → Requirements → Files → Review → Submit
- **Smart Validation**: Real-time form validation with helpful error messages
- **File Upload**: Technical drawings and specification documents
- **Professional Output**: Generates structured quote requests
- **Email Integration**: Mailto functionality (expandable to SMTP)
- **Progress Tracking**: Clear step indicators and navigation

## 🌐 **API Endpoints**

### **CAD Analysis**
- `POST /api/analyze-drawing` - Upload and analyze technical drawings
  - **Input**: FormData with file (PDF/PNG/JPG)
  - **AI Processing**: Google Gemini vision analysis or intelligent mock
  - **Output**: Extracted specs, confidence score, product recommendations

### **Product Recommendations**
- `GET /api/recommendations?productId={id}` - Get compatible products
  - **Logic**: Compatibility matrix + category matching
  - **Output**: Scored recommendations with reasoning

### **Quote Requests**
- `POST /api/submit-rfq` - Submit request for quote
  - **Input**: Contact info, requirements, files
  - **Processing**: Validation + email formatting
  - **Output**: Confirmation + email integration

## 🔐 **Environment Variables**

```bash
# Google Gemini AI (Optional - app works without it)
GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: All environment variables are optional. The app provides intelligent fallbacks for demo and development use.

## 🛠️ **Development**

### **Available Scripts**
```bash
# Development server with Turbopack (fast refresh)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Code linting with ESLint 9
npm run lint
```

### **Development Features**
- **Hot Reload**: Instant updates with Turbopack
- **TypeScript**: Full type checking and IntelliSense
- **ESLint**: Code quality and consistency checking
- **Responsive Testing**: Built-in mobile viewport testing
- **API Testing**: Test all endpoints locally

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. **Connect Repository**: Link your GitHub/GitLab repo to Vercel
2. **Environment Variables**: Add `GEMINI_API_KEY` in Vercel dashboard (optional)
3. **Auto Deploy**: Automatic deployments on push to main branch
4. **PWA Support**: Includes web manifest and service worker ready

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
- **Components**: Follow existing component patterns
- **Styling**: Use Tailwind CSS classes consistently
- **Testing**: Test all new features thoroughly
- **Documentation**: Update README if adding new features

## 📄 **License**

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 📞 **Support & Contact**

**SteelSmart Team**
- **Email**: [info@steelsmart.com](mailto:info@steelsmart.com)
- **Website**: [steelsmart.com](https://steelsmart.com)
- **Business Hours**: Monday-Friday, 9AM-6PM EST

## 🗺️ **Roadmap**

### **Phase 1: Core Platform (✅ Complete)**
- [x] AI-powered CAD analysis with Google Gemini
- [x] Comprehensive product catalog (20+ products)
- [x] Smart recommendation engine
- [x] Professional UI/UX with responsive design
- [x] RFQ system with multi-step forms

### **Phase 2: Enhanced Features (🚧 Planned)**
- [ ] **Database Integration**: PostgreSQL with Prisma ORM
- [ ] **User Authentication**: NextAuth.js with multiple providers
- [ ] **Advanced Search**: Elasticsearch for complex queries
- [ ] **Real-time Features**: WebSocket integration for live updates
- [ ] **Payment Integration**: Stripe for secure transactions

### **Phase 3: Advanced AI (🔮 Future)**
- [ ] **Multi-format CAD Support**: DWG, STEP, IGES files
- [ ] **3D Model Viewer**: Interactive 3D product visualization
- [ ] **ML Recommendations**: Machine learning-enhanced suggestions
- [ ] **Automated Quoting**: AI-powered price estimation
- [ ] **Mobile App**: React Native cross-platform app

### **Phase 4: Enterprise (🏢 Vision)**
- [ ] **Multi-tenant Architecture**: White-label solutions
- [ ] **API Marketplace**: Third-party integrations
- [ ] **Advanced Analytics**: Business intelligence dashboard
- [ ] **Supply Chain Integration**: ERP system connections

---

## 🌟 **Acknowledgments**

- **Google AI**: For the powerful Gemini 1.5 Flash API
- **Vercel**: For excellent Next.js hosting and deployment
- **Tailwind CSS**: For the utility-first CSS framework
- **Next.js Team**: For the amazing React framework
- **TypeScript**: For type safety and developer experience

**Built with ❤️ for engineers and manufacturers worldwide.**