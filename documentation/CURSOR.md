# Cursor AI Implementation Prompt - SteelSmart CAD Generator

## 🎯 Context & Objective
You are implementing a CAD Drawing Generator for the SteelSmart AI Marketplace. This is a new `/cad-generator` page that allows engineers to generate AutoCAD-compatible DXF files from text descriptions using AI-powered template matching.

**Existing Project Structure**: Next.js 15 + TypeScript + Tailwind CSS + Gemini AI integration already configured.

## 📋 Implementation Requirements

### 1. Create New Page: `/src/app/cad-generator/page.tsx`

**Core Functionality**:
- Text input for component descriptions
- Category selection (bracket, plate, beam, fastener)
- AI-powered parameter extraction using existing Gemini client
- Template-based DXF generation
- Live preview with SVG rendering
- Download functionality for DXF files

**UI Requirements**:
- Split-panel layout: Input (left) + Preview (right)
- Consistent with existing SteelSmart branding (Inter font, steel-blue colors)
- Mobile-responsive design
- Loading states and error handling
- Integration with existing Header/Footer components

### 2. Required Components

#### A. `/src/components/CADGeneratorForm.tsx`
```typescript
interface CADGeneratorFormProps {
  onGenerate: (request: CADGenerationRequest) => void;
  isLoading: boolean;
}

// Features needed:
// - Textarea for description with examples
// - Category dropdown
// - Parameter refinement section
// - Generate button with loading state
```

#### B. `/src/components/CADPreview.tsx`
```typescript
interface CADPreviewProps {
  generatedCAD: GeneratedCAD | null;
  onDownload: () => void;
}

// Features needed:
// - SVG preview of generated drawing
// - Parameter display table
// - Download DXF button
// - "Add to RFQ" integration button
```

#### C. `/src/components/TemplateSelector.tsx`
```typescript
// Visual template gallery with previews
// Quick-select common templates
// Category-based filtering
```

### 3. API Endpoint: `/src/app/api/generate-cad/route.ts`

**Core Logic**:
```typescript
// 1. Use existing Gemini client to extract parameters from description
// 2. Match description to appropriate DXF template
// 3. Substitute parameters in template
// 4. Return generated DXF content + preview SVG
// 5. Error handling for invalid inputs

interface CADGenerationRequest {
  description: string;
  category: 'bracket' | 'plate' | 'beam' | 'fastener';
  parameters?: {
    dimensions: { length: number; width: number; thickness: number; };
    holes: { count: number; diameter: number; pattern: string; };
    material: string;
  };
}

interface CADGenerationResponse {
  success: boolean;
  dxfContent: string;
  previewSVG: string;
  extractedParameters: any;
  templateUsed: string;
  recommendations: Product[];
}
```

### 4. Data & Templates

#### A. Create `/src/data/cad-templates.json`
```json
{
  "templates": [
    {
      "id": "l-bracket-basic",
      "name": "L-Bracket",
      "category": "bracket", 
      "description": "Standard L-shaped mounting bracket",
      "parameters": ["length", "width", "thickness", "hole_diameter", "hole_count"],
      "dxf_template": "templates/l-bracket.dxf",
      "preview_svg": "images/templates/l-bracket-preview.svg"
    }
  ]
}
```

#### B. Create sample DXF templates in `/public/templates/`
- `l-bracket.dxf` - Basic L-bracket with parameter placeholders
- `flat-plate.dxf` - Rectangular plate with hole patterns  
- `angle-bracket.dxf` - Corner bracket template
- `beam-connection.dxf` - Steel beam connection plate

### 5. Integration Points

**Existing System Integration**:
- Import existing Gemini client from `/src/lib/gemini-client.ts`
- Use existing product data from `/src/data/products.json` for recommendations
- Reuse UI components from `/src/components/ui/`
- Follow existing TypeScript interfaces in `/src/types/index.ts`

**Add to Navigation**:
- Update `/src/components/Header.tsx` to include "CAD Generator" link
- Add to mobile menu navigation

### 6. TypeScript Interfaces (Add to `/src/types/index.ts`)

```typescript
export interface CADGenerationRequest {
  description: string;
  category: 'bracket' | 'plate' | 'beam' | 'fastener';
  parameters?: CADParameters;
}

export interface CADParameters {
  dimensions: {
    length: number;
    width: number; 
    thickness: number;
  };
  holes: {
    count: number;
    diameter: number;
    pattern: 'linear' | 'circular' | 'grid';
  };
  material: string;
}

export interface GeneratedCAD {
  id: string;
  dxfContent: string;
  previewSVG: string;
  parameters: CADParameters;
  templateUsed: string;
  recommendations: Product[];
  createdAt: Date;
}

export interface CADTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: string[];
  dxf_template: string;
  preview_svg: string;
}
```

## 🎨 Design System Guidelines

**Colors** (match existing):
- Primary: `text-slate-900`, `bg-blue-600`
- Backgrounds: `bg-gray-50`, `bg-white`
- Borders: `border-gray-200`
- Success: `text-green-600`, `bg-green-50`

**Typography**:
- Headings: `font-bold text-2xl text-slate-900`
- Body: `text-gray-600`
- Labels: `text-sm font-medium text-gray-700`

**Components**:
- Use existing Button, Input, Modal components
- Loading states with `LoadingSpinner` component
- Form validation using existing patterns

## 🔧 Implementation Strategy

### Phase 1: Core Functionality (Target: 4-6 hours)
1. **Setup** (30 min): Create page structure, basic routing
2. **UI Layout** (2 hours): Split-panel design, responsive layout  
3. **Form Component** (1 hour): Input handling, validation
4. **API Endpoint** (1.5 hours): Gemini integration, parameter extraction
5. **Preview Component** (1 hour): SVG display, download functionality

### Phase 2: Template System (Target: 2-3 hours)  
1. **Template Data** (1 hour): JSON structure, sample DXF files
2. **Template Matching** (1 hour): Logic to select appropriate templates
3. **Parameter Substitution** (1 hour): DXF content generation

### Phase 3: Polish & Integration (Target: 1-2 hours)
1. **Error Handling**: User-friendly error states
2. **Product Recommendations**: Integration with existing catalog
3. **Navigation Updates**: Header menu integration
4. **Testing**: Basic functionality verification

## ⚠️ Important Notes

**File Handling**:
- DXF files should be served from `/public/templates/`
- Generated DXF content returned as downloadable blob
- SVG previews can be embedded inline or served as data URLs

**Performance**:
- Add loading states for AI processing (2-5 seconds expected)
- Cache template data to avoid repeated file reads
- Implement proper error boundaries

**Security**:
- Validate all user inputs before AI processing
- Sanitize generated file content before download
- Rate limiting on API endpoint (reuse existing patterns)

**Integration**:
- Follow existing code patterns from CAD analyzer
- Reuse Gemini client configuration and error handling
- Maintain consistency with existing component architecture

## 🎯 Success Criteria

After implementation, the page should:
- [ ] Accept text descriptions and generate CAD previews
- [ ] Download working DXF files compatible with AutoCAD
- [ ] Show parameter extraction results clearly
- [ ] Integrate seamlessly with existing site navigation
- [ ] Handle errors gracefully with user feedback
- [ ] Work responsively on mobile and desktop
- [ ] Match existing SteelSmart branding and UX patterns

**Priority**: Focus on getting the core text-to-DXF generation working first, then enhance the UI/UX in subsequent iterations.