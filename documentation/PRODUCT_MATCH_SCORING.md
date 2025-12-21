# Product Match Scoring System

## Overview

SteelSmart uses a sophisticated multi-factor scoring algorithm to match user requirements with catalog products. The system combines exact matching, fuzzy matching, and adaptive weighting to provide accurate recommendations.

## Scoring Architecture

```
User Requirements
    ↓
Normalization & Tokenization
    ↓
Candidate Filtering (Database Query)
    ↓
Multi-Factor Scoring
    ↓
Confidence Adjustment
    ↓
Final Score (0-99%)
```

## Core Components

### 1. Specification Normalization

Before scoring, user inputs are normalized:

```typescript
interface NormalizedSpecs {
  raw: DrawingAnalysis['extractedSpecs'];
  componentTokens: string[];           // Tokenized component type
  componentTypeId?: string;            // Matched taxonomy ID
  categoryHint?: string;               // Inferred category
  materialFamily?: string;             // Normalized material family
  materialToken?: string;              // Primary material keyword
  dimensionValues: number[];           // Extracted numeric dimensions
  loadValues: number[];                // Extracted load requirements
}
```

**Normalization Steps:**
- Tokenize component type (split by spaces, commas, slashes)
- Match against component taxonomy database
- Resolve material synonyms (e.g., "aluminium" → "aluminum")
- Extract numeric values from dimension strings
- Infer category from component tokens

### 2. Candidate Filtering

Products are pre-filtered before scoring to reduce computation:

```sql
SELECT * FROM products
WHERE 
  component_type_id = ? OR category = ?
  AND (material_family = ? OR material ILIKE ?)
LIMIT 100
```

**Filtering Logic:**
1. Match component type ID (if available)
2. Fall back to category match
3. Filter by material family or fuzzy material match
4. Limit to 100 candidates for performance

### 3. Multi-Factor Scoring

Each product is scored across 5 dimensions with adaptive weighting:

#### Factor 1: Component Type Match (Default Weight: 35%)

**Scoring Logic:**
```typescript
if (product.component_type_id === specs.componentTypeId) {
  return 1.0;  // Exact taxonomy match (weighted at 35%)
}
else if (keywordMatch(product, specs.componentTokens)) {
  return 0.8;  // Keyword match in name/description (weighted at 35%)
}
return 0;
```

**Examples:**
- User searches "servo motor" → Product has `component_type_id` for "servo motor" → **1.0 × 35% = 35% contribution**
- User searches "mounting bracket" → Product name contains "bracket" → **0.8 × 35% = 28% contribution**

#### Factor 2: Category Match (Default Weight: 30%)

**NEW: Explicit Category Selection**

When user explicitly selects a category (not "All Categories"), this becomes a major scoring factor.

**Scoring Logic:**
```typescript
// Only score if user explicitly selected a category
if (!specs.explicitCategory || specs.explicitCategory === 'all') {
  return 0;
}

// Exact category match
if (product.category === specs.explicitCategory) {
  return 1.0;  // Perfect match (weighted at 30%)
}

return 0;
```

**Behavior:**
- **Category only (no other specs)**: Returns all products in that category, sorted by availability and name
- **Category + other specs**: Category match contributes 30% to final score, other specs contribute remaining 70%
- **No category selected**: Category weight redistributed to other factors

**Examples:**
- User selects "Structural" category only → All structural products shown with 75-90% scores
- User selects "Robotic" + material "Aluminum" → Robotic products with aluminum get higher scores
- User selects "All Categories" → Category doesn't affect scoring

#### Factor 3: Material Match (Default Weight: 15%)

**Scoring Hierarchy:**
```typescript
// 1. Exact family match (highest)
if (product.material_family === specs.materialFamily) {
  return 0.20;  // e.g., both "steel"
}

// 2. Partial family match
if (productMaterial.includes(specs.materialFamily)) {
  return 0.18;  // e.g., "stainless steel" contains "steel"
}

// 3. Token overlap
const overlap = requestedTokens.filter(t => productTokens.includes(t)).length;
if (overlap > 0) {
  return 0.15 * (overlap / maxTokens);  // e.g., "carbon steel" vs "steel carbon alloy"
}

// 4. Simple token match
if (productMaterial.includes(specs.materialToken)) {
  return 0.12;  // e.g., "steel" in "steel alloy"
}

// 5. Same material category
if (sameMaterialCategory(requested, product)) {
  return 0.08;  // e.g., both are metals
}

return 0;
```

**Material Categories:**
- **Metals**: steel, aluminum, iron, copper, brass, bronze, titanium, stainless
- **Plastics**: plastic, polymer, nylon, abs, pvc, polycarbonate, acrylic

#### Factor 4: Dimension Match (Default Weight: 15%)

**Scoring Logic:**
```typescript
// Extract dimensions from multiple sources (priority order):
// 1. Structured specs (product_specs table)
// 2. JSONB specifications field
// 3. Product name (e.g., "Steel Beam 200x100x10mm")
// 4. Product description

const overlap = specs.dimensionValues.filter(dim =>
  productValues.some(value => withinTolerance(dim, value, 0.2))
);

return overlap.length / Math.max(specs.dimensionValues.length, productValues.length);
```

**Tolerance:** ±20% (configurable)

**Examples:**
- User: "200mm x 100mm" → Product: "200mm x 100mm" → **1.0 score** (100% match)
- User: "200mm x 100mm" → Product: "210mm x 95mm" → **1.0 score** (within 20% tolerance)
- User: "200mm x 100mm x 50mm" → Product: "200mm x 100mm" → **0.67 score** (2/3 dimensions match)

#### Factor 5: Load Capacity Match (Default Weight: 5%)

**Scoring Logic:**
```typescript
// Product must meet or exceed required load (with 10% safety margin)
const meetsRequirement = specs.loadValues.some(required =>
  productLoads.some(capacity => capacity >= required * 0.9)
);

return meetsRequirement ? 1.0 : 0;
```

**Binary Score:** Either meets requirement (1.0) or doesn't (0.0)

**Examples:**
- User requires: "500kg" → Product capacity: "600kg" → **1.0 score** ✓
- User requires: "500kg" → Product capacity: "450kg" → **1.0 score** ✓ (within 10% margin)
- User requires: "500kg" → Product capacity: "400kg" → **0.0 score** ✗

### 4. Adaptive Weighting

Weights are redistributed when data is missing:

```typescript
// Default weights
let weights = {
  component: 0.35,  // 35%
  category: 0.30,   // 30% (when explicitly selected)
  material: 0.15,   // 15%
  dimension: 0.15,  // 15%
  load: 0.05        // 5%
};

// If user doesn't provide dimensions, redistribute that 15%
if (!hasDimensionData) {
  weights.dimension = 0;
  // Redistribute proportionally to other factors
}

// If user doesn't select category, redistribute that 30%
if (!hasExplicitCategory) {
  weights.category = 0;
  // Redistribute proportionally to other factors
}
```

**Example Scenarios:**

| Provided Data | Component | Category | Material | Dimension | Load |
|--------------|-----------|----------|----------|-----------|------|
| All fields | 35% | 30% | 15% | 15% | 5% |
| Category only | 0% | 95% | 0% | 0% | 0% |
| Category + Material | 0% | 67% | 33% | 0% | 0% |
| Component + Material (no category) | 70% | 0% | 30% | 0% | 0% |
| No dimensions | 41% | 35% | 18% | 0% | 6% |

### 5. Availability Bonus

In-stock products receive a +5% bonus:

```typescript
if (product.in_stock) {
  finalScore += 0.05;
  matchedSpecs.push('availability');
}
```

### 6. Sample Drawing Bonus

When using pre-loaded sample drawings (I-Beam, Drill Guide, Brake Rotor), scores are boosted to ensure high-quality matches:

```typescript
if (specs.isSampleDrawing && finalScore > 0.05) {
  // Ensure sample drawing matches get at least 90% score
  finalScore = Math.max(finalScore, 0.90);
  matchedSpecs.push('sample-drawing-match');
}
```

**Rationale:** Sample drawings are carefully curated with known product matches in the catalog. This bonus ensures users see excellent matches when testing the system.

### 7. Exact Name Match Bonus

When the product name closely matches the search query (non-sample drawings only):

```typescript
if (!specs.isSampleDrawing && specs.raw.productName) {
  const productNameLower = product.name.toLowerCase();
  const searchNameLower = specs.raw.productName.toLowerCase();
  
  // Check for exact or very close name match
  if (productNameLower === searchNameLower || 
      productNameLower.includes(searchNameLower) || 
      searchNameLower.includes(productNameLower)) {
    finalScore += 0.15; // 15% bonus for name match
    matchedSpecs.push('exact-name-match');
  }
}
```

**Examples:**
- User searches: "Steel Beam" → Product: "Steel Beam I-200" → **+15% bonus** ✓
- User searches: "Servo Motor" → Product: "High-Torque Servo Motor" → **+15% bonus** ✓
- User searches: "Bracket" → Product: "Mounting Bracket" → **+15% bonus** ✓

### 8. Confidence Adjustment

Final score is adjusted based on product data completeness:

```typescript
// Calculate data quality (0-1 scale)
const dataQuality = {
  hasDimensions: boolean,
  hasLoadCapacity: boolean,
  hasMaterialFamily: boolean,
  hasComponentType: boolean,
  completeness: number  // 0-1 based on 7 fields
};

// Apply confidence multiplier (70-100%)
const confidenceMultiplier = 0.7 + (0.3 * dataQuality.completeness);
finalScore = finalScore * confidenceMultiplier;
```

**Data Quality Fields (7 total):**
1. Structured dimensions (width, height, depth, etc.)
2. Load capacity (min/max)
3. Material family
4. Component type ID
5. Specifications (JSONB)
6. Material
7. Description

**Examples:**
- Product with all 7 fields → **100% confidence** → No reduction
- Product with 5/7 fields → **86% confidence** → Score × 0.86
- Product with 3/7 fields → **73% confidence** → Score × 0.73

## Complete Scoring Formula

```typescript
// Step 1: Calculate component scores
componentScore = calculateComponentScore(product, specs);
categoryScore = calculateCategoryScore(product, specs);
materialScore = calculateMaterialScore(product, specs);
dimensionScore = calculateDimensionScore(product, specs);
loadScore = calculateLoadScore(product, specs);

// Step 2: Apply adaptive weights
weights = calculateAdaptiveWeights(specs);
weightedScore = 
  componentScore * weights.component +
  categoryScore * weights.category +
  materialScore * weights.material +
  dimensionScore * weights.dimension +
  loadScore * weights.load;

// Step 3: Add availability bonus
if (product.in_stock) {
  weightedScore += 0.05;
}

// Step 4: Apply confidence multiplier
dataQuality = calculateDataQuality(product);
confidenceMultiplier = 0.7 + (0.3 * dataQuality.completeness);
finalScore = weightedScore * confidenceMultiplier;

// Step 5: Cap at 99% (never 100%)
finalScore = Math.min(finalScore, 0.99);

// Step 6: Filter low scores
if (finalScore <= 0.05) {
  return null;  // Don't show products with <5% match
}
```

## Scoring Examples

### Example 1: Category Only Search

**User Input:**
- Category: "Structural" (explicitly selected)
- No other specs

**Product:**
- Category: "structural" ✓
- In Stock: Yes ✓
- Data Completeness: 71%

**Calculation:**
```
Uses searchByCategory() method:
Base score: 0.75 (category match)
Availability: +0.15 (in stock)
Position penalty: -0.005 (first result)
Subtotal: 0.895
No confidence multiplier for category-only search
Final: 0.895 (90%)
```

**Result:** 90% match (Excellent Match) ⭐

### Example 2: Category + Material Match

**User Input:**
- Category: "Robotic" (explicitly selected)
- Material: "Aluminum"

**Product:**
- Category: "robotic" ✓
- Material Family: "aluminum" ✓
- In Stock: Yes ✓
- Data Completeness: 86%

**Calculation:**
```
Adaptive Weights:
- Category: 0.67 (30% → 67%)
- Material: 0.33 (15% → 33%)

Category: 1.0 (exact match)
Material: 1.0 (exact family)
Availability: +0.05
Subtotal: 1.0×0.67 + 1.0×0.33 + 0.05
        = 0.67 + 0.33 + 0.05
        = 1.05
Confidence: 0.7 + (0.3 × 0.86) = 0.958
Final: 1.05 × 0.958 = 1.006 → capped at 0.99 (99%)
```

**Result:** 99% match (Excellent Match) ⭐

### Example 3: Perfect Match with All Fields

**User Input:**
- Category: "Robotic" (explicitly selected)
- Component: "Servo Motor"
- Material: "Aluminum"
- Dimensions: "100mm x 50mm x 30mm"
- Load: "10kg"

**Product:**
- Category: "robotic" ✓
- Component Type ID: "servo-motor" ✓
- Material Family: "aluminum" ✓
- Dimensions: "100mm x 50mm x 30mm" ✓
- Load Capacity: "15kg" ✓
- In Stock: Yes ✓
- Data Completeness: 100%

**Calculation:**
```
Component: 1.0 × 0.35 = 0.35
Category: 1.0 × 0.30 = 0.30
Material: 1.0 × 0.15 = 0.15
Dimension: 1.0 × 0.15 = 0.15
Load: 1.0 × 0.05 = 0.05
Availability: +0.05
Subtotal: 1.05
Confidence: 1.0 (100% complete)
Final: 1.05 × 1.0 = 1.05 → capped at 0.99 (99%)
```

**Result:** 99% match (Excellent Match) ⭐

### Example 4: Good Match with Missing Data

**User Input:**
- Component: "Steel Beam"
- Material: "Carbon Steel"
- Dimensions: "200mm x 100mm"

**Product:**
- Component Type ID: "structural-beam" ✓
- Material: "Steel" (partial match)
- Dimensions: "210mm x 95mm" (within tolerance) ✓
- Load Capacity: Not specified
- In Stock: Yes ✓
- Data Completeness: 57% (4/7 fields)

**Calculation:**
```
Adaptive Weights (no load data):
- Component: 0.5625 (45% → 56.25%)
- Material: 0.25 (20% → 25%)
- Dimension: 0.25 (20% → 25%)
- Load: 0 (not provided)

Component: 0.45 (exact match)
Material: 0.18 (partial family match)
Dimension: 0.25 (within tolerance)
Load: 0 (not applicable)
Availability: +0.05
Subtotal: 0.45×0.5625 + 0.18×0.25 + 0.25×0.25 + 0.05
        = 0.253 + 0.045 + 0.0625 + 0.05
        = 0.4105
Confidence: 0.7 + (0.3 × 0.57) = 0.871
Final: 0.4105 × 0.871 = 0.357 (36%)
```

**Result:** 36% match (Fair Match)

### Example 5: Keyword Match Only

**User Input:**
- Component: "Mounting Bracket"
- Material: "Stainless Steel"

**Product:**
- Name: "L-Bracket for Mounting"
- Material: "Stainless Steel 304"
- No structured specs
- Data Completeness: 29% (2/7 fields)

**Calculation:**
```
Adaptive Weights (only component + material):
- Component: 0.692 (45% → 69.2%)
- Material: 0.308 (20% → 30.8%)

Component: 0.35 (keyword match)
Material: 0.20 (exact family)
Availability: 0 (out of stock)
Subtotal: 0.35×0.692 + 0.20×0.308
        = 0.242 + 0.062
        = 0.304
Confidence: 0.7 + (0.3 × 0.29) = 0.787
Final: 0.304 × 0.787 = 0.239 (24%)
```

**Result:** 24% match (Below threshold, may not show)

## Product Name Search

When user provides a product name, a separate search path is used with enhanced scoring:

### Search Strategy

```typescript
// 1. Full-text search with ilike (optionally filtered by category)
SELECT * FROM products
WHERE name ILIKE '%search_term%' 
   OR description ILIKE '%search_term%'
   AND (category = ? OR category IS NOT NULL)  // If category filter applied
LIMIT 20

// 2. Calculate base relevance score
if (exact_name_match) {
  relevanceScore = 0.95;  // Exact match
}
else if (name_contains_term) {
  relevanceScore = 0.85;  // Contains term
}
else {
  // Token-based scoring
  nameScore = nameMatches / totalTokens;
  descScore = descMatches / totalTokens;
  relevanceScore = (nameScore × 0.7) + (descScore × 0.3);
}

// 3. Boost for category match (if filtering by category)
if (filterCategory && product.category === filterCategory) {
  relevanceScore += 0.05;
}

// 4. Boost for in-stock
if (in_stock) {
  relevanceScore += 0.05;
}

// 5. Apply data quality confidence multiplier (85-100%)
dataQuality = calculateDataQuality(product);
confidenceMultiplier = 0.85 + (0.15 × dataQuality.completeness);
finalScore = relevanceScore × confidenceMultiplier;

// 6. Filter weak matches
if (finalScore < 0.3) {
  exclude();
}
```

### Examples

**Search: "servo motor" (no category filter)**
- Product: "High-Torque Servo Motor" (100% data) → **0.95 × 1.0 = 95% match** (exact)
- Product: "Servo Motor Controller" (85% data) → **0.85 × 0.98 = 83% match** (contains)
- Product: "Motor for Servo Systems" (70% data) → **0.70 × 0.96 = 67% match** (tokens)

**Search: "servo motor" + Category: "Robotic"**
- Product: "High-Torque Servo Motor" (robotic, in stock, 100% data) → **1.05 × 1.0 = 99% match** ⭐
- Product: "Servo Motor Controller" (robotic, out of stock, 85% data) → **0.90 × 0.98 = 88% match**
- Product: "Industrial Servo" (structural, in stock, 70% data) → **0.75 × 0.96 = 72% match** (no category boost)

## Fallback Strategies

When no matches are found, the system uses fallback strategies:

### 1. Collaborative Filtering
- Find products popular in similar searches
- Score: 60-65%
- Reasoning: "Popular in similar searches"

### 2. Category-Based Fallback
- Match by category + in-stock
- Score: 40-45%
- Reasoning: "Related {category} component (in stock)"

### 3. Material-Based Fallback
- Match by material family
- Score: 35-40%
- Reasoning: "Similar material ({material})"

### 4. Generic Popular Products
- Top-selling products
- Score: 25-30%
- Reasoning: "Popular product in catalog"

## Alternative Suggestions (AI)

When catalog matches are insufficient, AI alternatives are suggested:

### AI Scoring
- Uses Google Gemini 2.5 Flash
- Analyzes requirements and suggests alternatives
- Confidence score: 0-1 (converted to 0-100%)
- Includes reasoning, standards compliance, supplier info

### Integration with Catalog Scores
```typescript
// Catalog matches
catalogMatches.forEach(match => {
  recommendations.push({
    type: 'catalog',
    product: match.product,
    matchScore: match.matchScore,  // 0-99%
    reasoning: match.reasoning
  });
});

// AI alternatives
alternatives.forEach(alt => {
  recommendations.push({
    type: 'alternative',
    alternative: alt,
    matchScore: alt.confidence * 100,  // 0-100%
    reasoning: alt.reasoning
  });
});

// Sort by score
recommendations.sort((a, b) => b.matchScore - a.matchScore);
```

## Performance Optimizations

### 1. Database Indexing
```sql
CREATE INDEX idx_products_component_type ON products(component_type_id);
CREATE INDEX idx_products_material_family ON products(material_family);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_in_stock ON products(in_stock);
```

### 2. Candidate Limiting
- Pre-filter to 100 candidates max
- Reduces scoring computation by 90%+

### 3. Caching
- Redis cache for common searches (5-10 min TTL)
- React Query client-side cache (5 min stale time)

### 4. Lazy Evaluation
- Only fetch product details for top matches
- Structured specs loaded in batch

## Scoring Thresholds

| Score Range | Label | Badge Color | Meaning |
|-------------|-------|-------------|---------|
| 85-99% | Excellent Match | Green | High confidence, meets all criteria |
| 70-84% | Good Match | Yellow | Meets most criteria, minor gaps |
| 50-69% | Fair Match | Orange | Partial match, consider alternatives |
| 5-49% | Weak Match | Red | Low confidence, fallback result |
| 0-4% | No Match | - | Filtered out, not shown |

## Component Type vs Category

### Understanding the Hierarchy

SteelSmart uses a two-level classification system:

```
Category (Broad)
  └─ Component Type (Specific)
      └─ Individual Products
```

### Categories (4 total)

High-level product classifications for user navigation:

1. **Structural** 🏗️ - Beams, plates, frames, structural steel
2. **Fasteners** 🔩 - Bolts, nuts, screws, washers, rivets
3. **Robotic** 🤖 - Servo motors, actuators, sensors, controllers
4. **Custom** ⚙️ - Brackets, mounts, adapters, custom fabrications

**Database Field:** `category` (enum)
**User Interface:** Enhanced dropdown in Product Recommender with icons
**Scoring Weight:** 30% when explicitly selected

### Component Types (100+ total)

Specific product types within each category, stored in `component_taxonomy` table:

**Examples:**
- Category: Robotic
  - Component Types: "High-Torque Servo Motor", "Linear Actuator", "Rotary Encoder", "Proximity Sensor"
  
- Category: Structural
  - Component Types: "I-Beam", "H-Beam", "Steel Plate", "Angle Iron", "Channel Steel"
  
- Category: Fasteners
  - Component Types: "Hex Bolt M8", "Socket Head Cap Screw", "Lock Washer", "Hex Nut"

**Database Field:** `component_type_id` (references `component_taxonomy.id`)
**User Interface:** Inferred from product name search or CAD analysis
**Scoring Weight:** 35% when matched

### Matching Logic

```typescript
// Priority 1: Explicit category (user dropdown selection)
if (user_selected_category) {
  filter_by_category();
  score_category_match(30%);
}

// Priority 2: Component type ID (precise match)
if (component_type_id_matches) {
  score_component_match(35%);
}

// Priority 3: Inferred category (from keywords)
if (inferred_category_from_keywords) {
  filter_by_category();
  // No scoring bonus (just filtering)
}
```

### Example Workflow

**User Action:** Selects "Robotic" category + searches "servo motor"

**System Behavior:**
1. Filters products: `WHERE category = 'robotic'`
2. Searches names: `WHERE name ILIKE '%servo motor%'`
3. Scores results:
   - Category match: +30% (robotic = robotic)
   - Name match: +35% (contains "servo motor")
   - In stock: +5%
   - Total: 70% base score
4. Applies confidence multiplier based on data quality
5. Returns ranked results (typically 85-99% scores)

## Future Improvements

### Planned Enhancements
1. **Machine Learning**: Train model on user interactions
2. **Vector Embeddings**: Semantic similarity for descriptions
3. **Price Optimization**: Factor in price competitiveness
4. **Lead Time**: Prioritize faster delivery
5. **User Preferences**: Personalized scoring weights
6. **A/B Testing**: Optimize scoring parameters

### Experimental Features
- **Image Similarity**: Match by product images
- **Cross-Sell Scoring**: Bundle recommendations
- **Supplier Reputation**: Factor in supplier ratings
- **Historical Performance**: Learn from past orders

## References

- **Implementation**: `src/lib/product-matcher.ts`
- **API Route**: `src/app/api/recommendations/match/route.ts`
- **Types**: `src/types/index.ts`
- **Database Schema**: `supabase/migrations/`
- **Component**: `src/components/products/ProductRecommender.tsx`
