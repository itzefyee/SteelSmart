# Data Enrichment Flow Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     INITIAL STATE (88.1%)                        │
│  - 21 products missing component_type_id (0%)                   │
│  - 11 products missing load capacity (47.6%)                    │
│  - 1 product missing dimensions (95.2%)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Component Mapping                    │
│  Script: map-component-types.ts                                 │
│  Method: Keyword matching + category fallback                   │
│  Result: component_type_id 0% → 100%                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 2: Load Capacity Calculation               │
│  Script: calculate-load-capacity.ts                             │
│  Methods:                                                        │
│    - Fasteners: ISO 898-1 tables                                │
│    - Structural: Material × cross-section                       │
│    - Robotic: Extract from specs                                │
│  Result: load_max_kn 47.6% → 90%                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 3: Dimension Completion                   │
│  Script: fill-dimensions.ts                                     │
│  Methods:                                                        │
│    - Extract from name (e.g., "50x50x5mm")                      │
│    - Use typical dimensions                                     │
│    - Mark as custom                                             │
│  Result: dimensions 95.2% → 100%                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 4: Material Validation                   │
│  Script: validate-materials.ts                                  │
│  Method: Match against material_synonyms                        │
│  Result: material_family consistency 100%                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                PHASE 5: Cross-Reference Validation               │
│  Script: validate-references.ts                                 │
│  Checks:                                                         │
│    - product_specs → products                                   │
│    - products → categories                                      │
│    - products → component_taxonomy                              │
│    - products → material_synonyms                               │
│  Result: Data integrity 100%                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FINAL STATE (100%)                           │
│  ✅ All products have component_type_id                         │
│  ✅ 90% have load capacity (2 marked N/A)                       │
│  ✅ All products have dimensions                                │
│  ✅ All references validated                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Phase 1: Component Type Mapping

```
Product: "High-Torque Servo Motor 120W"
    ↓
┌─────────────────────────────────────────┐
│ 1. Extract keywords from name           │
│    Keywords: ["servo", "motor"]         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Match against component_taxonomy     │
│    Category: "robotic"                  │
│    Keywords: ["servo", "motor", ...]    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Find best match                      │
│    Match: "Servo Motor" (100%)          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Update product                       │
│    component_type_id = <uuid>           │
└─────────────────────────────────────────┘
```

## Detailed Phase 2: Load Capacity Calculation

### Fasteners Flow

```
Product: "Hex Bolt M12x80 Grade 8.8"
    ↓
┌─────────────────────────────────────────┐
│ 1. Identify product type                │
│    Type: Fastener (category)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Extract size and grade               │
│    Size: M12                            │
│    Grade: 8.8                           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Look up in ISO 898-1 table           │
│    M12 Grade 8.8 = 42.0 kN              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Update product_specs                 │
│    load_max_kn = 42.0                   │
│    note = "ISO 898-1 standard"          │
└─────────────────────────────────────────┘
```

### Structural Components Flow

```
Product: "Steel Beam I-200x100x6mm"
    ↓
┌─────────────────────────────────────────┐
│ 1. Identify product type                │
│    Type: Structural (category)          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Get dimensions from product_specs    │
│    width_mm: 200                        │
│    height_mm: 100                       │
│    thickness_mm: 6                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Get material properties              │
│    material_family: "steel"             │
│    yield_strength: 250 MPa              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Calculate cross-section area         │
│    area = (200×100) - (188×88)          │
│    area = 3456 mm²                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. Calculate load capacity              │
│    load = 250 × 3456 / 1000             │
│    load = 864 kN                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 6. Update product_specs                 │
│    load_max_kn = 864.0                  │
│    note = "Calculated from dimensions"  │
└─────────────────────────────────────────┘
```

## Detailed Phase 3: Dimension Completion

### Extract from Name

```
Product: "Steel Angle Iron 50x50x5mm"
    ↓
┌─────────────────────────────────────────┐
│ 1. Parse product name                   │
│    Pattern: (\d+)x(\d+)x(\d+)mm         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Extract dimensions                   │
│    width_mm: 50                         │
│    height_mm: 50                        │
│    thickness_mm: 5                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Update product_specs                 │
│    note = "Extracted from name"         │
└─────────────────────────────────────────┘
```

### Use Typical Dimensions

```
Product: "Custom Aluminum Mounting Bracket"
    ↓
┌─────────────────────────────────────────┐
│ 1. Identify product type                │
│    Type: Bracket (from name)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Check if custom                      │
│    Contains "custom": YES               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Mark as custom                       │
│    dimension_note = "Custom dimensions  │
│    - specify in RFQ"                    │
└─────────────────────────────────────────┘
```

## Detailed Phase 4: Material Validation

```
Product: "Stainless Steel Plate"
    ↓
┌─────────────────────────────────────────┐
│ 1. Get current material                 │
│    material: "Stainless Steel"          │
│    material_family: "steel"             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Query material_synonyms              │
│    family: "stainless"                  │
│    synonyms: ["stainless", "316", ...] │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Match material to family             │
│    "stainless steel" → "stainless"      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Update if different                  │
│    material_family: "steel" → "stainless"│
└─────────────────────────────────────────┘
```

## Detailed Phase 5: Cross-Reference Validation

```
┌─────────────────────────────────────────┐
│ Check 1: product_specs → products       │
│                                         │
│ SELECT ps.product_id                    │
│ FROM product_specs ps                   │
│ LEFT JOIN products p ON ps.product_id = p.id│
│ WHERE p.id IS NULL                      │
│                                         │
│ Expected: 0 orphaned records            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Check 2: products → categories          │
│                                         │
│ SELECT p.id, p.category                 │
│ FROM products p                         │
│ LEFT JOIN categories c ON p.category = c.id│
│ WHERE c.id IS NULL                      │
│                                         │
│ Expected: 0 invalid categories          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Check 3: products → component_taxonomy  │
│                                         │
│ SELECT p.id, p.component_type_id        │
│ FROM products p                         │
│ LEFT JOIN component_taxonomy ct         │
│   ON p.component_type_id = ct.id        │
│ WHERE p.component_type_id IS NULL       │
│    OR ct.id IS NULL                     │
│                                         │
│ Expected: 0 missing/invalid types       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Check 4: products → material_synonyms   │
│                                         │
│ SELECT p.id, p.material_family          │
│ FROM products p                         │
│ LEFT JOIN material_synonyms ms          │
│   ON p.material_family = ms.family      │
│ WHERE p.material_family IS NULL         │
│    OR ms.family IS NULL                 │
│                                         │
│ Expected: 0 missing/invalid families    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Result: All checks passed ✅            │
│ Data integrity: 100%                    │
└─────────────────────────────────────────┘
```

## Master Script Flow (enrich-all.ts)

```
START
  ↓
┌─────────────────────────────────────────┐
│ Run Initial Audit                       │
│ npm run audit-data                      │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Phase 1: Component Types                │
│ Duration: ~30s                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Phase 2: Load Capacity                  │
│ Duration: ~45s                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Phase 3: Dimensions                     │
│ Duration: ~20s                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Phase 4: Material Validation            │
│ Duration: ~15s                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Phase 5: Reference Validation           │
│ Duration: ~10s                          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Run Final Audit                         │
│ npm run audit-data                      │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Display Summary                         │
│ - Total duration: ~2 minutes            │
│ - Success rate: 100%                    │
│ - Final completeness: 100%              │
└─────────────────────────────────────────┘
  ↓
END
```

## Error Handling Flow

```
Script Execution
  ↓
┌─────────────────────────────────────────┐
│ Try: Process product                    │
└─────────────────────────────────────────┘
  ↓
  ├─ Success ─────────────────────────────┐
  │                                        │
  │  ┌─────────────────────────────────┐  │
  │  │ Log success                     │  │
  │  │ Increment success counter       │  │
  │  │ Continue to next product        │  │
  │  └─────────────────────────────────┘  │
  │                                        │
  └─ Failure ─────────────────────────────┤
                                           │
     ┌─────────────────────────────────┐   │
     │ Catch error                     │   │
     │ Log error message               │   │
     │ Increment failure counter       │   │
     │ Continue to next product        │   │
     │ (Don't stop entire process)     │   │
     └─────────────────────────────────┘   │
                                           │
                                           ↓
                                    ┌──────────────┐
                                    │ Final Report │
                                    │ - Successes  │
                                    │ - Failures   │
                                    │ - Duration   │
                                    └──────────────┘
```

## Data Flow Across Tables

```
┌──────────────┐
│   products   │
│              │
│ - id         │◄─────────┐
│ - name       │          │
│ - category   │──────┐   │
│ - material   │      │   │
│ - material_  │──┐   │   │
│   family     │  │   │   │
│ - component_ │  │   │   │
│   type_id    │──│───│───│───┐
└──────────────┘  │   │   │   │
                  │   │   │   │
┌──────────────┐  │   │   │   │
│ material_    │  │   │   │   │
│ synonyms     │  │   │   │   │
│              │  │   │   │   │
│ - family     │◄─┘   │   │   │
│ - synonyms   │      │   │   │
└──────────────┘      │   │   │
                      │   │   │
┌──────────────┐      │   │   │
│ categories   │      │   │   │
│              │      │   │   │
│ - id         │◄─────┘   │   │
│ - name       │          │   │
└──────────────┘          │   │
                          │   │
┌──────────────┐          │   │
│ component_   │          │   │
│ taxonomy     │          │   │
│              │          │   │
│ - id         │◄─────────┘   │
│ - canonical_ │              │
│   name       │              │
│ - keywords   │              │
└──────────────┘              │
                              │
┌──────────────┐              │
│ product_     │              │
│ specs        │              │
│              │              │
│ - product_id │◄─────────────┘
│ - width_mm   │
│ - height_mm  │
│ - load_max_kn│
│ - ...        │
└──────────────┘
```
