# Zero-Null Data Enrichment Strategy

## Executive Summary

Current data completeness: **88.1%**  
Target: **100% (Zero Null Policy)**

## Gap Analysis

### Critical Gaps (Blocking 100% completeness)

1. **Component Type ID** - 0% coverage (21/21 products missing)
   - Impact: Cannot leverage component_taxonomy for intelligent matching
   - Solution: Map products to component_taxonomy table

2. **Load Capacity** - 52.4% missing (11/21 products)
   - Impact: Cannot recommend products for structural applications
   - Solution: Calculate/estimate based on product type and dimensions

3. **Dimensions** - 4.8% missing (1 product: Custom Aluminum Mounting Bracket)
   - Impact: Cannot perform dimensional matching
   - Solution: Set reasonable defaults or mark as "custom"

## Database Schema Relationships

```
products
├── product_specs (1:1) - dimensions, load, material
├── categories (N:1) - category classification
├── component_taxonomy (N:1) - component type hierarchy
└── material_synonyms (N:M) - material name variations
```

## Enrichment Phases

### Phase 1: Component Type Mapping (Priority: CRITICAL)

**Goal**: Map all 21 products to `component_taxonomy.id`

**Approach**:
```typescript
// Rule-based mapping using product name + category
const componentTypeMap = {
  // Robotic Components
  'servo motor': 'Servo Motor',
  'linear actuator': 'Linear Actuator',
  'rotary encoder': 'Encoder / Sensor',
  'precision coupling': 'Precision Coupling',
  
  // Structural Steel
  'steel beam': 'Structural Beam',
  'steel plate': 'Steel Plate',
  'steel angle': 'Structural Beam',
  'steel channel': 'Structural Beam',
  'gallows frame': 'Gallows Frame',
  'brake rotor': 'Brake Rotor',
  
  // Fasteners
  'hex bolt': 'Hex Bolt',
  'hex nut': 'Hex Nut',
  'socket head': 'Socket Head Cap Screw',
  'washer': 'Washer',
  
  // Custom Parts
  'mounting bracket': 'Custom Bracket',
  'drill guide': 'Surgical Drill Guide',
};
```

**Validation**:
- Check if component type exists in `component_taxonomy`
- Fall back to category-based default if no match
- Log unmapped products for manual review

### Phase 2: Load Capacity Calculation (Priority: HIGH)

**Goal**: Fill missing load capacity for 11 products

**Approach**:

1. **Structural Components** (beams, plates, angles):
   ```typescript
   // Calculate based on material + cross-section
   load_max_kn = calculateStructuralLoad({
     material: product.material,
     width_mm: specs.width_mm,
     height_mm: specs.height_mm,
     thickness_mm: specs.thickness_mm,
     length_mm: specs.length_mm,
   });
   ```

2. **Fasteners** (bolts, nuts, washers):
   ```typescript
   // Use standard load tables
   const boltLoadTable = {
     'M8': { grade_8_8: 18.4, grade_10_9: 26.1 },
     'M10': { grade_8_8: 29.0, grade_10_9: 41.0 },
     'M12': { grade_8_8: 42.0, grade_10_9: 59.0 },
   };
   ```

3. **Robotic Components** (motors, actuators):
   ```typescript
   // Extract from specifications or set N/A
   load_max_kn = extractFromSpecs(product.specifications) || null;
   ```

4. **Custom Parts**:
   ```typescript
   // Mark as "custom" - requires engineering analysis
   load_max_kn = null; // Explicitly null with reason
   load_capacity_note = "Requires custom engineering analysis";
   ```

### Phase 3: Dimension Completion (Priority: MEDIUM)

**Goal**: Fill missing dimensions for "Custom Aluminum Mounting Bracket"

**Approach**:
```typescript
// Option 1: Set as "custom" with typical ranges
{
  width_mm: null,
  height_mm: null,
  depth_mm: null,
  dimension_note: "Custom dimensions - specify in RFQ"
}

// Option 2: Set reasonable defaults
{
  width_mm: 100,  // Typical mounting bracket
  height_mm: 50,
  depth_mm: 20,
  dimension_note: "Standard size - custom available"
}
```

### Phase 4: Material Family Validation (Priority: LOW)

**Goal**: Ensure consistency with `material_synonyms` table

**Approach**:
```typescript
// Validate material_family against material_synonyms
const validateMaterialFamily = async (product) => {
  const { data: synonyms } = await supabase
    .from('material_synonyms')
    .select('family')
    .contains('synonyms', [product.material.toLowerCase()]);
  
  if (synonyms && synonyms[0]) {
    return synonyms[0].family;
  }
  
  // Fall back to existing material_family
  return product.material_family;
};
```

### Phase 5: Cross-Reference Validation (Priority: LOW)

**Goal**: Ensure data consistency across tables

**Checks**:
1. All `product_specs.product_id` exist in `products.id`
2. All `products.category` exist in `categories.id`
3. All `products.component_type_id` exist in `component_taxonomy.id`
4. All `products.material_family` exist in `material_synonyms.family`

## Implementation Scripts

### 1. Component Type Mapper
```bash
npx tsx scripts/missing-data-supabase/map-component-types.ts
```

### 2. Load Capacity Calculator
```bash
npx tsx scripts/missing-data-supabase/calculate-load-capacity.ts
```

### 3. Dimension Filler
```bash
npx tsx scripts/missing-data-supabase/fill-dimensions.ts
```

### 4. Material Validator
```bash
npx tsx scripts/missing-data-supabase/validate-materials.ts
```

### 5. Cross-Reference Validator
```bash
npx tsx scripts/missing-data-supabase/validate-references.ts
```

### 6. Master Enrichment Script (All-in-One)
```bash
npx tsx scripts/missing-data-supabase/enrich-all.ts
```

## Zero-Null Policy Rules

### When to Use NULL
- **NEVER** for required fields (component_type_id, material_family)
- **ONLY** when data is truly unknown AND cannot be reasonably estimated

### When to Use Defaults
- Dimensions for custom parts: Use typical ranges with notes
- Load capacity for non-structural parts: Use "N/A" or 0 with notes
- Material family: Use "other" as last resort

### When to Use Notes
- Add `*_note` fields to explain why data is missing or estimated
- Examples:
  - `dimension_note: "Custom dimensions - specify in RFQ"`
  - `load_capacity_note: "Not applicable for electronic components"`
  - `material_note: "Multiple materials available - contact supplier"`

## Expected Outcomes

### After Phase 1 (Component Type Mapping)
- **component_type_id**: 0% → 100% (21/21 products)
- **Overall completeness**: 88.1% → 93.5%

### After Phase 2 (Load Capacity)
- **load_max_kn**: 47.6% → 90% (19/21 products, 2 marked N/A)
- **Overall completeness**: 93.5% → 97.8%

### After Phase 3-5 (Dimension + Validation)
- **All dimensions**: 95.2% → 100%
- **Overall completeness**: 97.8% → **100%**

## Monitoring & Maintenance

### Audit Schedule
```bash
# Daily audit
npm run audit-data

# Weekly deep validation
npx tsx scripts/missing-data-supabase/validate-all.ts
```

### Quality Metrics
- **Completeness Score**: % of non-null fields
- **Confidence Score**: Average AI confidence for enriched data
- **Validation Score**: % of data passing cross-reference checks

### Continuous Improvement
1. Track enrichment accuracy over time
2. Update component type mappings as new products added
3. Refine load capacity calculations based on engineering feedback
4. Add new material families to `material_synonyms` as needed

## Next Steps

1. ✅ Review this strategy document
2. ⬜ Implement Phase 1: Component Type Mapper
3. ⬜ Implement Phase 2: Load Capacity Calculator
4. ⬜ Implement Phase 3: Dimension Filler
5. ⬜ Run master enrichment script
6. ⬜ Validate 100% completeness
7. ⬜ Set up monitoring dashboard
