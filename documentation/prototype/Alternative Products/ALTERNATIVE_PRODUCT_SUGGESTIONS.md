# Alternative Product Suggestion System

## Overview

When no viable products are found in the SteelSmart catalog, the system automatically generates intelligent alternative suggestions using multiple data sources and AI-powered analysis.

## Data Sources & References

### 1. **AI-Powered Generation (Primary)**
- **Source**: Google Gemini 2.0 Flash
- **Purpose**: Generate intelligent alternatives based on extracted specifications
- **Capabilities**:
  - Suggests standard part numbers from common catalogs
  - Recommends material alternatives
  - Identifies modified standard parts
  - Provides custom fabrication guidance
  - References relevant industry standards

### 2. **Industry Standards Databases**

#### Structural Steel Standards
- **AISC 360** - Specification for Structural Steel Buildings
  - Standard I-beam sizes
  - Connection details
  - Material specifications
- **ASTM Standards**:
  - **ASTM A36** - Carbon Structural Steel
  - **ASTM A572** - High-Strength Low-Alloy Steel
  - **ASTM A992** - Structural Steel Shapes

#### Fastener Standards
- **ASME B18.2.1** - Square and Hex Bolts and Screws
- **ISO 4014** - Hexagon head bolts
- **ISO 4032** - Hexagon nuts
- **ISO 7089** - Plain washers

#### Robotic Component Standards
- **ISO 9409-1** - Manipulating industrial robots - Mechanical interfaces
- **ISO 9409-2** - Shafts for mechanical interface

#### Material Standards
- **ASTM A276** - Stainless Steel Bars
- **ASTM B221** - Aluminum Alloy Extruded Bars
- **SAE J429** - Mechanical and Material Requirements for Externally Threaded Fasteners

### 3. **External Supplier Catalogs**

#### Industrial Supply Marketplaces
- **McMaster-Carr** (mcmaster.com)
  - Comprehensive industrial parts catalog
  - Standard part numbers
  - Technical specifications
- **Grainger** (grainger.com)
  - Industrial supplies and equipment
  - Fast shipping options
- **Misumi** (misumi-ec.com)
  - Precision components
  - CAD downloads available
  - Custom configurations

#### Online Marketplaces
- **Amazon Industrial**
  - Wide selection
  - Fast shipping
- **Alibaba Industrial**
  - International suppliers
  - Bulk pricing

### 4. **Custom Fabrication Services**

#### On-Demand Manufacturing
- **Protolabs** (protolabs.com)
  - Rapid prototyping
  - CNC machining
  - Injection molding
- **Xometry** (xometry.com)
  - On-demand manufacturing network
  - Multiple processes
  - Instant quotes
- **SendCutSend** (sendcutsend.com)
  - Laser cutting
  - Sheet metal fabrication
  - Fast turnaround

#### Local Services
- Local machine shops
- Metal fabrication shops
- Welding services

## Implementation Strategy

### When No Catalog Matches Found

1. **AI Analysis** (Primary)
   - Gemini analyzes extracted specifications
   - Generates 3-5 intelligent alternatives
   - Includes part numbers, standards, and suppliers
   - Provides reasoning for each suggestion

2. **Standards Lookup** (Secondary)
   - Checks relevant industry standards
   - Suggests standard part numbers
   - References applicable code sections

3. **Custom Fabrication** (Tertiary)
   - Suggests custom fabrication when needed
   - Provides estimated costs and lead times
   - Recommends qualified suppliers

4. **External Suppliers** (Quaternary)
   - Suggests external marketplaces
   - Provides supplier contact information
   - Estimates availability and pricing

## Response Format

```typescript
interface AlternativeSuggestionResponse {
  alternatives: AlternativeProduct[];
  reasoning: string;
  suggestedAction: 'custom_fabrication' | 'standard_part' | 'modified_existing' | 'external_supplier';
  estimatedCost?: string;
  leadTime?: string;
}
```

## Example Use Cases

### Case 1: Non-Standard Bracket
**Input**: Custom bracket with specific hole pattern
**Output**:
- AI suggests: "Standard L-bracket with modification"
- Standards: AISC 360 connection details
- Suppliers: McMaster-Carr, Misumi
- Action: `modified_existing`

### Case 2: Special Material Requirement
**Input**: Component requiring specific alloy
**Output**:
- AI suggests: Material alternatives (ASTM equivalents)
- Standards: ASTM material specifications
- Suppliers: Specialty metal suppliers
- Action: `standard_part`

### Case 3: Unique Dimensions
**Input**: Very specific dimensions not in catalog
**Output**:
- AI suggests: Custom fabrication
- Standards: Manufacturing tolerances (AISC 303)
- Suppliers: Protolabs, Xometry, local shops
- Action: `custom_fabrication`

## Integration Points

### 1. Product Matcher Integration
```typescript
// In product-matcher.ts
if (recommendations.length === 0) {
  const alternatives = await alternativeSuggester.suggestAlternatives(
    extractedSpecs,
    analysisReasoning
  );
  // Return alternatives instead of fallback products
}
```

### 2. API Route Integration
```typescript
// In /api/analyze-drawing/route.ts
if (recommendations.length === 0) {
  const alternatives = await alternativeSuggester.suggestAlternatives(
    analysis.extractedSpecs,
    analysis.reasoning
  );
  return { alternatives, noCatalogMatch: true };
}
```

### 3. UI Component
```typescript
// New component: AlternativeSuggestions.tsx
// Displays alternatives with:
// - Product suggestions
// - Standards references
// - Supplier information
// - Action buttons (Request Quote, Contact Supplier, etc.)
```

## Best Practices

1. **Always provide alternatives** - Never show "no results" without suggestions
2. **Include reasoning** - Explain why each alternative is suggested
3. **Reference standards** - Always cite relevant industry standards
4. **Provide supplier info** - Include contact information and links
5. **Estimate costs** - Give rough price ranges when possible
6. **Set expectations** - Clearly indicate lead times and availability

## Future Enhancements

1. **Supplier API Integration**
   - Real-time inventory checks
   - Live pricing from suppliers
   - Automated quote requests

2. **Standards Database**
   - Comprehensive standards lookup
   - Part number cross-references
   - Material property databases

3. **Machine Learning**
   - Learn from user selections
   - Improve suggestion accuracy
   - Personalize recommendations

4. **RFQ Integration**
   - Auto-generate RFQ from alternatives
   - Send to multiple suppliers
   - Compare quotes automatically

## References

### Industry Standards Organizations
- **AISC** (American Institute of Steel Construction): aisc.org
- **ASTM** (American Society for Testing and Materials): astm.org
- **ASME** (American Society of Mechanical Engineers): asme.org
- **ISO** (International Organization for Standardization): iso.org
- **SAE** (Society of Automotive Engineers): sae.org

### Supplier Resources
- McMaster-Carr: Technical support and CAD files
- Grainger: Product specifications and compatibility
- Misumi: CAD downloads and technical drawings
- Protolabs: Design guidelines and material properties

### Standards Databases
- ANSI Webstore: Standards search and purchase
- ISO Online Browsing Platform: Standards lookup
- ASTM Compass: Standards database access

