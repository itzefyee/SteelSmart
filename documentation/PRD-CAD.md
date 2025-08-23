# SteelSmart CAD Drawing Generator - Product Requirements Document

## 🎯 Product Overview
**Vision**: Enable engineers and manufacturers to generate professional CAD drawings for steel/metal components using natural language descriptions.

**Target Users**: Engineers and manufacturers who need quick CAD prototypes and technical drawings for steel/metal components.

## 🎪 User Stories

### Primary Use Cases
1. **Quick Prototype Generation**: "Generate a mounting bracket for a servo motor with 4 bolt holes"
2. **Custom Part Design**: "Create a steel beam connection plate 12" x 8" with standard bolt pattern"
3. **Assembly Drawing**: "Generate a motor mount assembly with bracket and fasteners"

### User Journey
1. Navigate to `/cad-generator` page
2. Enter text description of desired component
3. Select component category (bracket, beam, fastener, custom)
4. Specify key parameters (dimensions, materials, standards)
5. Generate and preview CAD drawing
6. Download DXF file for AutoCAD
7. Optional: Add to RFQ or find matching products

## 🔧 Technical Specifications

### Phase 1: Template-Based MVP
**Complexity: 4/10 | Timeline: 1-2 weeks**

#### Core Features
- **Template Library**: 10+ parametric templates for common steel parts
  - Mounting brackets (L-bracket, flat bracket, angle bracket)
  - Steel plates (rectangular, circular, custom shapes)
  - Beam connections (moment connections, shear plates)
  - Fastener patterns (bolt circles, linear patterns)

- **Input System**: 
  - Natural language processing using existing Gemini AI
  - Parameter extraction from text descriptions
  - Form-based parameter refinement interface

- **Generation Logic**:
  - Template selection based on component type
  - Parameter substitution in DXF templates
  - Basic validation and error handling

#### Technical Implementation
```typescript
// Core interfaces
interface CADGenerationRequest {
  description: string;
  category: 'bracket' | 'plate' | 'beam' | 'fastener' | 'custom';
  parameters: {
    dimensions: { length: number; width: number; thickness: number; };
    material: string;
    holes: { count: number; diameter: number; pattern: string; };
  };
}

interface CADTemplate {
  id: string;
  category: string;
  baseTemplate: string; // DXF template content
  parameters: ParameterDefinition[];
  preview: string; // SVG preview
}
```

#### File Structure
```
/cad-generator/
├── page.tsx                 # Main generator interface
├── components/
│   ├── CADGeneratorForm.tsx  # Input form component
│   ├── ParameterEditor.tsx   # Parameter refinement
│   ├── CADPreview.tsx       # SVG preview component
│   └── TemplateSelector.tsx  # Template selection UI
├── api/
│   └── generate-cad/
│       └── route.ts         # CAD generation endpoint
└── templates/
    ├── bracket-templates.dxf
    ├── plate-templates.dxf
    └── beam-templates.dxf
```

### Phase 2: AI-Enhanced Generation
**Complexity: 6/10 | Timeline: 3-4 weeks**

#### Enhanced Features
- **AI Integration**: Connect to Zoo.dev or similar Text-to-CAD API
- **Smarter Parsing**: Advanced NLP for complex descriptions
- **2D Profile Generation**: Custom shapes from descriptions
- **Assembly Templates**: Multi-component drawings

#### API Integration Example
```typescript
// Zoo.dev integration
const generateCADModel = async (description: string) => {
  const response = await fetch('https://zoo.dev/api/text-to-cad', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.ZOO_API_KEY}` },
    body: JSON.stringify({
      prompt: `Generate a steel ${description} suitable for manufacturing`,
      format: 'step',
      units: 'inches'
    })
  });
  return response.json();
};
```

## 🎨 User Interface Requirements

### Page Layout (`/cad-generator`)
```
┌─ Header Navigation ─────────────────────┐
│ SteelSmart Logo    [Analyzer][Catalog]  │
├─ Hero Section ─────────────────────────┤
│ CAD Drawing Generator                   │
│ "Describe your component and get        │
│  professional CAD drawings instantly"   │
├─ Main Generator Interface ─────────────┤
│ ┌─ Input Panel ──┐ ┌─ Preview Panel ─┐ │
│ │ [Text Area]    │ │ [CAD Preview]   │ │
│ │ "Generate a    │ │ [SVG Rendering] │ │
│ │ mounting..."    │ │                 │ │
│ │                │ │ [Parameter      │ │
│ │ [Category]     │ │  Display]       │ │
│ │ [GenerateBtn]  │ │                 │ │
│ └────────────────┘ └─────────────────┘ │
├─ Generated Results ─────────────────────┤
│ ┌─ Download Options ──────────────────┐ │
│ │ [Download DXF] [View in CAD] [RFQ] │ │
│ └──────────────────────────────────────┘ │
├─ Related Products ──────────────────────┤
│ "Based on your design, you might need:" │
│ [Product Cards with recommendations]     │
└─ Footer ───────────────────────────────┘
```

### Component States
- **Loading**: Spinning indicator during generation
- **Success**: Preview with download options
- **Error**: Clear error messages with retry options
- **Empty**: Helpful examples and templates

## 📊 Success Metrics

### Phase 1 Success Criteria
- [ ] Generate DXF files for 5+ template categories
- [ ] 90% successful parameter extraction from descriptions
- [ ] Sub-5 second generation time
- [ ] Clean, professional UI matching SteelSmart branding
- [ ] Mobile-responsive design

### User Experience Goals
- **Time Savings**: 80% faster than manual CAD creation
- **Accuracy**: 95% of generated drawings require no major corrections
- **Adoption**: 30% of users try the generator within first visit
- **Integration**: 50% of generated drawings lead to RFQ submissions

## 🔗 Integration Points

### Existing System Integration
1. **Product Catalog**: Link generated components to matching inventory
2. **RFQ System**: Direct integration for custom part quotes
3. **CAD Analyzer**: Reverse workflow - analyze then generate variations
4. **User Data**: Track generation patterns for product development

### External Dependencies
- **Phase 1**: DXF template library, parameter extraction via Gemini
- **Phase 2**: Zoo.dev API or similar text-to-CAD service
- **Phase 3**: Custom CAD generation model training

## 🚀 Development Priorities

### Must-Have (Phase 1)
- Basic template-based generation
- DXF output for AutoCAD compatibility  
- Parameter extraction from text
- Professional UI/UX

### Should-Have (Phase 2)
- AI-powered custom shape generation
- Multiple output formats
- Assembly drawing capabilities
- Advanced parameter controls

### Nice-to-Have (Phase 3)
- Real-time collaboration
- Version control for designs
- Manufacturing cost estimation
- Integration with external CAD tools

## 📋 Technical Debt Considerations
- **Template Maintenance**: Regular updates to DXF templates
- **API Dependencies**: Fallback systems for external services
- **File Storage**: CDN strategy for generated files
- **Performance**: Caching strategy for repeated generations

---

**Next Steps**: Implement Phase 1 MVP focusing on template-based generation with excellent UX, then iterate based on user feedback and usage patterns.