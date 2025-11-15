# Product Overview

SteelSmart is an AI-enhanced metal & steel parts marketplace built for engineers and manufacturers. The platform enables users to discover, analyze, and source metal components with intelligent AI assistance.

## Core Features

- **AI-Powered CAD Analysis**: Google Gemini 1.5 Flash analyzes technical drawings (PDF, PNG, JPG) to extract specifications and recommend compatible products
- **CAD Generation**: Zoo Dev API integration for generating 3D CAD models from text prompts
- **Product Catalog**: 20+ products across 4 categories (Robotic Components, Structural Steel, Fasteners, Custom Parts)
- **Smart Recommendations**: AI-driven product matching based on extracted specs and compatibility matrices
- **RFQ System**: Multi-step quote request forms with file upload support
- **3D Preview**: Three.js-based CAD model visualization with STEP/STL file support

## User Workflows

1. **CAD Analysis**: Upload technical drawing → AI extracts specs → Get product recommendations
2. **CAD Generation**: Enter text prompt → Generate 3D model → Preview and download
3. **Product Discovery**: Browse catalog → Filter by category/material/price → View details
4. **Quote Request**: Fill RFQ form → Upload attachments → Submit for pricing

## Authentication & Data

- Supabase authentication with email/password
- Row Level Security (RLS) ensures users only access their own data
- Persistent storage for CAD history, drawings, and RFQ submissions
