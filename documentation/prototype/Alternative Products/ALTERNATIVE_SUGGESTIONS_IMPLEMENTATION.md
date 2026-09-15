# Alternative Product Suggestions - Implementation Guide

## Overview

This document explains how the alternative product suggestion system works and how to use it when no viable products are found in the catalog.

## How It Works

### 1. **Trigger Condition**
The alternative suggestion system activates when:
- No products in the catalog match the extracted specifications
- The product matcher returns zero recommendations
- Meaningful specifications are available (componentType, dimensions, or material)

### 2. **Multi-Source Strategy**

The system uses four complementary approaches:

#### A. AI-Powered Generation (Primary)
- **Source**: Google Gemini 2.0 Flash
- **What it does**:
  - Analyzes extracted specifications
  - Generates intelligent alternatives with specific part numbers
  - Suggests material alternatives
  - References industry standards
  - Provides supplier recommendations

#### B. Industry Standards Lookup (Secondary)
- **Sources**: AISC, ASTM, ASME, ISO standards
- **What it does**:
  - Suggests standard part numbers
  - References applicable code sections
  - Provides material specifications
  - Links to standard catalogs

#### C. Custom Fabrication Suggestions (Tertiary)
- **Sources**: On-demand manufacturing services
- **What it does**:
  - Suggests custom fabrication when needed
  - Provides estimated costs and lead times
  - Recommends qualified suppliers

#### D. External Supplier Suggestions (Quaternary)
- **Sources**: Industrial marketplaces
- **What it does**:
  - Suggests external marketplaces
  - Provides supplier contact information
  - Estimates availability

## Data Sources Reference

### Industry Standards

#### Structural Steel
- **AISC 360**: Specification for Structural Steel Buildings
  - Standard I-beam sizes
  - Connection details (Section J3.3, J3.4)
  - Material specifications
- **ASTM A36**: Carbon Structural Steel
- **ASTM A572**: High-Strength Low-Alloy Steel
- **ASTM A992**: Structural Steel Shapes

#### Fasteners
- **ASME B18.2.1**: Square and Hex Bolts and Screws
- **ISO 4014**: Hexagon head bolts
- **ISO 4032**: Hexagon nuts
- **ISO 7089**: Plain washers

#### Robotic Components
- **ISO 9409-1**: Manipulating industrial robots - Mechanical interfaces
- **ISO 9409-2**: Shafts for mechanical interface

### External Suppliers

#### Industrial Supply Marketplaces
1. **McMaster-Carr** (mcmaster.com)
   - Comprehensive catalog
   - Standard part numbers
   - CAD files available
   - Technical specifications

2. **Grainger** (grainger.com)
   - Industrial supplies
   - Fast shipping
   - Product specifications

3. **Misumi** (misumi-ec.com)
   - Precision components
   - CAD downloads
   - Custom configurations

#### Online Marketplaces
- **Amazon Industrial**: Wide selection, fast shipping
- **Alibaba Industrial**: International suppliers, bulk pricing

#### On-Demand Manufacturing
- **Protolabs** (protolabs.com): Rapid prototyping, CNC machining
- **Xometry** (xometry.com): On-demand manufacturing network
- **SendCutSend** (sendcutsend.com): Laser cutting, sheet metal

## Implementation Details

### Code Structure

```
src/lib/
├── alternative-product-suggester.ts  # Main service
└── product-matcher.ts               # Integration point
```

### API Integration

The alternative suggestions are automatically included in the `/api/analyze-drawing` response when no catalog matches are found:

```typescript
// In analyze-drawing/route.ts
if (analysis.recommendedProducts.length === 0) {
  alternativeSuggestions = await productMatcher.getAlternativeSuggestions(analysis);
  analysis.alternativeSuggestions = alternativeSuggestions;
}
```

### Response Format

```typescript
{
  success: true,
  data: {
    extractedSpecs: { ... },
    recommendedProducts: [],
    alternativeSuggestions: {
      alternatives: [
        {
          name: "Standard I-Beam (AISC)",
          description: "...",
          category: "structural",
          material: "A36 Steel",
          specifications: {
            dimensions: "...",
            standards: ["AISC 360", "ASTM A36"]
          },
          source: "industry_standard",
          confidence: 0.8,
          reasoning: "...",
          supplierInfo: {
            suggestedSuppliers: ["Steel Service Centers"],
            estimatedPrice: "Contact for quote",
            leadTime: "2-4 weeks"
          },
          standards: [
            {
              code: "AISC 360",
              name: "Specification for Structural Steel Buildings"
            }
          ]
        }
      ],
      reasoning: "Overall explanation...",
      suggestedAction: "standard_part",
      estimatedCost: "$10 - $500",
      leadTime: "1-2 weeks"
    }
  }
}
```

## Usage Examples

### Example 1: Non-Standard Bracket

**Input Specifications**:
- Component Type: Custom mounting bracket
- Dimensions: 150mm x 100mm x 25mm
- Material: Stainless Steel 304
- Load: 800N static

**Alternative Suggestions**:
1. **AI Suggestion**: "Standard L-bracket with modification"
   - Part Number: McMaster-Carr 91065A123
   - Reasoning: Standard bracket can be modified to match dimensions
   - Supplier: McMaster-Carr
   - Action: `modified_existing`

2. **Standards Suggestion**: "AISC 360 Connection Details"
   - Standard: AISC 360 Section J3.3
   - Reasoning: Standard connection details may apply
   - Action: `standard_part`

3. **Custom Fabrication**: "Custom Fabricated Bracket"
   - Supplier: Protolabs, Xometry
   - Estimated Cost: $200 - $500
   - Lead Time: 2-4 weeks
   - Action: `custom_fabrication`

### Example 2: Special Material Requirement

**Input Specifications**:
- Component Type: Structural beam
- Material: Grade S690 Steel (high-strength)
- Dimensions: 200mm x 100mm x 6m

**Alternative Suggestions**:
1. **Material Alternative**: "ASTM A572 Grade 50 equivalent"
   - Reasoning: Similar strength properties, more readily available
   - Standards: ASTM A572, AISC 360
   - Action: `standard_part`

2. **Standard Part**: "Check AISC Steel Construction Manual"
   - Standard sizes available
   - Supplier: Steel Service Centers
   - Action: `standard_part`

## Best Practices

### 1. Always Provide Alternatives
Never show "no results" without suggestions. The system ensures at least one alternative is always provided.

### 2. Include Reasoning
Every alternative includes:
- Why it's suggested
- Confidence level
- Specific part numbers or standards when available

### 3. Reference Standards
Always cite relevant industry standards:
- Standard code (e.g., "AISC 360")
- Standard name
- Specific section when applicable

### 4. Provide Supplier Information
Include:
- Supplier names and websites
- Estimated pricing (when available)
- Lead times
- Contact information

### 5. Set Clear Expectations
- Clearly indicate when custom fabrication is needed
- Provide realistic cost and lead time estimates
- Explain the difference between standard and custom parts

## Future Enhancements

### 1. Supplier API Integration
- Real-time inventory checks
- Live pricing from suppliers
- Automated quote requests

### 2. Standards Database
- Comprehensive standards lookup
- Part number cross-references
- Material property databases

### 3. Machine Learning
- Learn from user selections
- Improve suggestion accuracy
- Personalize recommendations

### 4. RFQ Integration
- Auto-generate RFQ from alternatives
- Send to multiple suppliers
- Compare quotes automatically

## Testing

To test the alternative suggestion system:

1. Upload a drawing with specifications that don't match any catalog products
2. The system should automatically generate alternatives
3. Check that alternatives include:
   - AI-generated suggestions
   - Standards references
   - Supplier information
   - Cost and lead time estimates

## Troubleshooting

### No Alternatives Generated
- Check that extracted specifications are meaningful
- Verify Gemini API key is configured
- Check console logs for errors

### Low Quality Suggestions
- Ensure Gemini API is properly configured
- Check that specifications are detailed enough
- Review AI prompt in `alternative-product-suggester.ts`

### Missing Standards References
- Verify standards database is complete
- Check that component type matches standards categories
- Review `getStandardPartSuggestions()` method

## References

- **AISC**: https://www.aisc.org/
- **ASTM**: https://www.astm.org/
- **ASME**: https://www.asme.org/
- **ISO**: https://www.iso.org/
- **McMaster-Carr**: https://www.mcmaster.com/
- **Grainger**: https://www.grainger.com/
- **Misumi**: https://www.misumi-ec.com/

