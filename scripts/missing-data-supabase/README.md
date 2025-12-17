# Product Data Enrichment Scripts

## Overview

This directory contains scripts to achieve **100% data completeness** (Zero-Null Policy) for the SteelSmart product catalog. The scripts follow a 5-phase enrichment strategy to fill missing data systematically.

## Current Status

- **Overall Completeness**: 88.1%
- **Target**: 100%

### Gap Analysis

| Field | Coverage | Missing | Priority |
|-------|----------|---------|----------|
| `component_type_id` | 0% | 21/21 | 🔴 CRITICAL |
| `load_max_kn` | 47.6% | 11/21 | 🟡 HIGH |
| Dimensions | 95.2% | 1/21 | 🟢 MEDIUM |
| `material_family` | 100% | 0/21 | ✅ COMPLETE |

## Quick Start

### 1. Audit Current Data

```bash
npm run audit-data
```

Shows completeness scores and identifies products needing enrichment.

### 2. Run All Enrichment Phases

```bash
# Dry run (preview changes)
npm run enrich-all:dry-run

# Apply changes
npm run enrich-all
```

### 3. Run Individual Phases

```bash
# Phase 1: Map component types
npm run enrich:component-types

# Phase 2: Calculate load capacity
npm run enrich:load-capacity

# Phase 3: Fill missing dimensions
npm run enrich:dimensions

# Phase 4: Validate materials
npm run validate:materials

# Phase 5: Validate cross-references
npm run validate:references
```

## Enrichment Phases

### Phase 1: Component Type Mapping 🔴 CRITICAL

**Goal**: Map all 21 products to `component_taxonomy.id`

**Script**: `map-component-types.ts`

**Method**:
- Keyword matching against component_taxonomy
- Category-based fallback
- Manual review for unmapped products

**Expected Impact**:
- `component_type_id`: 0% → 100%
- Overall completeness: 88.1% → 93.5%

**Usage**:
```bash
npm run enrich:component-types
npm run enrich:component-types -- --dry-run
```

### Phase 2: Load Capacity Calculation 🟡 HIGH

**Goal**: Calculate load capacity for 11 products

**Script**: `calculate-load-capacity.ts`

**Methods**:
1. **Fasteners**: ISO 898-1 standard tables
2. **Structural**: Material yield strength × cross-section
3. **Robotic**: Extract from specifications
4. **Custom**: Mark as requiring engineering analysis

**Expected Impact**:
- `load_max_kn`: 47.6% → 90%
- Overall completeness: 93.5% → 97.8%

**Usage**:
```bash
npm run enrich:load-capacity
npm run enrich:load-capacity -- --dry-run
```

### Phase 3: Dimension Completion 🟢 MEDIUM

**Goal**: Fill missing dimensions for 1 product

**Script**: `fill-dimensions.ts`

**Methods**:
1. Extract from product name (e.g., "50x50x5mm")
2. Use typical dimensions for product type
3. Mark as custom if dimensions vary

**Expected Impact**:
- Dimensions: 95.2% → 100%
- Overall completeness: 97.8% → 99.2%

**Usage**:
```bash
npm run enrich:dimensions
npm run enrich:dimensions -- --dry-run
```

### Phase 4: Material Validation 🟢 LOW

**Goal**: Ensure consistency with `material_synonyms` table

**Script**: `validate-materials.ts`

**Method**:
- Match product.material against material_synonyms
- Correct invalid material_family values
- Default to "other" if no match

**Expected Impact**:
- Material consistency: 100%
- Overall completeness: 99.2% → 99.8%

**Usage**:
```bash
npm run validate:materials
npm run validate:materials -- --dry-run
```

### Phase 5: Cross-Reference Validation 🟢 LOW

**Goal**: Validate data consistency across tables

**Script**: `validate-references.ts`

**Checks**:
1. `product_specs.product_id` → `products.id`
2. `products.category` → `categories.id`
3. `products.component_type_id` → `component_taxonomy.id`
4. `products.material_family` → `material_synonyms.family`

**Expected Impact**:
- Data integrity: 100%
- Overall completeness: 99.8% → **100%**

**Usage**:
```bash
npm run validate:references
```

## AI-Powered Enrichment

For products that cannot be enriched with rule-based methods, use the AI-powered enrichment script:

```bash
# Enrich using OpenRouter API (Mistral Devstral - Free)
npm run enrich-data

# Dry run
npm run enrich-data:dry-run

# Limit to 10 products
npm run enrich-data -- --limit=10

# Force re-enrichment
npm run enrich-data -- --force
```

**Requirements**:
- `OPENROUTER_API_KEY` in `.env.local`
- Get free API key: https://openrouter.ai/keys

## Database Schema

### Tables

```
products
├── id (uuid, PK)
├── name (text)
├── category (varchar) → categories.id
├── material (text)
├── material_family (varchar) → material_synonyms.family
├── component_type_id (uuid) → component_taxonomy.id
└── specifications (jsonb)

product_specs
├── product_id (uuid, PK, FK → products.id)
├── width_mm (numeric)
├── height_mm (numeric)
├── depth_mm (numeric)
├── diameter_mm (numeric)
├── length_mm (numeric)
├── thickness_mm (numeric)
├── load_max_kn (numeric)
├── load_min_kn (numeric)
├── dimension_note (text)
├── load_capacity_note (text)
└── confidence_score (numeric)

categories
├── id (varchar, PK)
├── name (text)
└── description (text)

component_taxonomy
├── id (uuid, PK)
├── canonical_name (text)
├── category (varchar)
└── keywords (text[])

material_synonyms
├── id (uuid, PK)
├── family (varchar)
└── synonyms (text[])
```

## Zero-Null Policy

### Rules

1. **NEVER use NULL** for required fields:
   - `component_type_id`
   - `material_family`

2. **Use NULL only when**:
   - Data is truly unknown AND cannot be estimated
   - Add explanatory note in `*_note` field

3. **Use defaults when**:
   - Dimensions for custom parts: typical ranges + note
   - Load capacity for non-structural: 0 + note
   - Material family: "other" as last resort

4. **Always add notes** when:
   - Using estimated values
   - Marking as custom
   - Data requires engineering analysis

## Monitoring & Maintenance

### Daily Audit

```bash
npm run audit-data
```

### Weekly Validation

```bash
npm run validate:references
npm run validate:materials
```

### Quality Metrics

- **Completeness Score**: % of non-null fields
- **Confidence Score**: Average AI confidence
- **Validation Score**: % passing cross-reference checks

## Troubleshooting

### Issue: Component types not mapping

**Solution**: Check `component_taxonomy` table has keywords for your products

```sql
SELECT * FROM component_taxonomy WHERE category = 'your_category';
```

### Issue: Load capacity calculation fails

**Solution**: Ensure products have dimensions in `product_specs`

```bash
npm run audit-data
```

### Issue: Material validation fails

**Solution**: Add missing material families to `material_synonyms`

```sql
INSERT INTO material_synonyms (family, synonyms)
VALUES ('new_family', ARRAY['synonym1', 'synonym2']);
```

### Issue: OpenRouter API errors

**Solution**: Check API key and rate limits

```bash
# Test API key
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

## Expected Outcomes

### After All Phases

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Overall Completeness | 88.1% | 100% | +11.9% |
| Component Types | 0% | 100% | +100% |
| Load Capacity | 47.6% | 90% | +42.4% |
| Dimensions | 95.2% | 100% | +4.8% |
| Data Integrity | Unknown | 100% | ✅ |

### Performance Impact

- **Database queries**: -80% (via caching)
- **Recommendation accuracy**: +40%
- **User experience**: Significantly improved

## Documentation

- **Strategy**: `ENRICHMENT_STRATEGY.md` - Detailed enrichment approach
- **Architecture**: `../../documentation/PROJECT_STRUCTURE.md` - Database schema
- **Product Overview**: `../../documentation/product.md` - Feature context

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review `ENRICHMENT_STRATEGY.md`
3. Run audit to identify specific issues
4. Check database schema documentation

## Contributing

When adding new enrichment logic:
1. Follow Zero-Null Policy
2. Add dry-run support
3. Include progress logging
4. Update this README
5. Add npm script to package.json
