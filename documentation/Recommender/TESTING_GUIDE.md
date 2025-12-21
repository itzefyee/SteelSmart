# Testing Guide - Product Recommender Improvements

Quick guide to test the Phase 1 & 2 improvements.

---

## 🧪 Phase 1: Algorithm Improvements

### Test 1: Multi-Source Dimension Extraction

**Goal**: Verify dimensions are extracted from multiple sources

**Steps**:
1. Find a product in Supabase without `product_specs` entry
2. Ensure product name contains dimensions (e.g., "Steel Beam 200x100x10mm")
3. Run a recommendation search
4. Check if dimensions are matched

**Expected**: Product should match even without structured specs

**Verify in code**:
```typescript
// In browser console or test
const product = {
  name: 'Steel Beam 200x100x10mm',
  structuredSpecs: null
};
// Should extract [200, 100, 10]
```

---

### Test 2: Fuzzy Material Matching

**Goal**: Verify similar materials match

**Test cases**:
- Search: "carbon steel" → Should match "steel carbon alloy"
- Search: "aluminum" → Should match "aluminium"
- Search: "stainless" → Should match "stainless steel"

**Expected**: Higher match scores for similar materials

---

### Test 3: Adaptive Weight Redistribution

**Goal**: Verify weights adjust when data missing

**Test cases**:
1. Search with only material → Material weight should increase
2. Search with only dimensions → Dimension weight should increase
3. Search with all fields → Standard weights

**Expected**: Scores remain reasonable even with partial data

---

### Test 4: Confidence Scores

**Goal**: Verify confidence scores are calculated

**Steps**:
1. Run any product search
2. Check response includes `confidence` field
3. Check response includes `dataQuality` object

**Expected**:
```json
{
  "productId": "xxx",
  "score": 0.75,
  "confidence": 0.82,
  "dataQuality": {
    "hasDimensions": true,
    "hasLoadCapacity": false,
    "hasMaterialFamily": true,
    "hasComponentType": true,
    "completeness": 0.82
  }
}
```

---

## 🤖 Phase 2: AI Enrichment

### Test 1: Data Audit Script

**Steps**:
```bash
npm run audit-data
```

**Expected output**:
- Total products count
- Statistics on missing data
- Completeness distribution
- Top 10 products needing enrichment
- Overall quality score

**Verify**:
- Numbers match your database
- Percentages add up to 100%
- Recommendations are actionable

---

### Test 2: Enrichment Dry Run

**Steps**:
```bash
npm run enrich-data:dry-run
```

**Expected output**:
- List of products to be enriched
- Extracted specifications for each
- Confidence scores
- "This was a DRY RUN" message at end

**Verify**:
- No database changes made
- Extractions look reasonable
- Confidence scores are >0.5

---

### Test 3: Enrichment (Small Batch)

**Steps**:
```bash
npx tsx scripts/enrich-product-data.ts --limit=5
```

**Expected output**:
- 5 products processed
- Success/fail count
- Database updated

**Verify in Supabase**:
1. Check `product_specs` table - new entries added
2. Check `products.material_family` - values updated
3. Check confidence scores are logged

---

### Test 4: Enrichment Impact

**Steps**:
```bash
# Before
npm run audit-data

# Enrich
npm run enrich-data

# After
npm run audit-data
```

**Expected**:
- Data completeness increased
- More products with dimensions
- More products with material_family
- Overall quality score improved

---

## 🔍 Integration Testing

### Test 1: CAD Analyzer → Recommendations

**Steps**:
1. Upload a CAD drawing
2. Get analysis results
3. Click "Get Recommendations"
4. Check recommendation quality

**Expected**:
- Higher match scores
- More relevant products
- Confidence scores shown
- Data quality indicators visible

---

### Test 2: Product Recommender Page

**Steps**:
1. Go to `/product-recommender`
2. Enter search criteria
3. View results

**Expected**:
- Results include confidence badges
- Data quality warnings for incomplete products
- Better match quality overall

---

### Test 3: Product Detail Page

**Steps**:
1. View any product detail page
2. Check "You may also like" section

**Expected**:
- Compatible products shown
- Confidence scores visible
- Reasoning provided

---

## 📊 Metrics to Track

### Before/After Comparison

Track these metrics before and after improvements:

**Data Quality**:
- [ ] Data completeness percentage
- [ ] Products with dimensions
- [ ] Products with load capacity
- [ ] Products with material_family

**Recommendation Quality**:
- [ ] Average match score
- [ ] "No results" rate
- [ ] Average confidence score
- [ ] User click-through rate

**User Experience**:
- [ ] Time to find relevant product
- [ ] Number of searches per session
- [ ] RFQ conversion rate

---

## ✅ Acceptance Criteria

### Phase 1 (Algorithm)
- [x] Multi-source extraction works
- [x] Fuzzy material matching works
- [x] Adaptive weights redistribute correctly
- [x] Confidence scores calculated
- [x] Data quality metrics included
- [x] No TypeScript errors
- [x] No runtime errors

### Phase 2 (Enrichment)
- [x] Audit script runs successfully
- [x] Enrichment dry run works
- [x] Enrichment updates database
- [x] Confidence scores logged
- [x] Data quality improves
- [x] No data corruption

### Integration
- [ ] CAD Analyzer integration works
- [ ] Product Recommender shows confidence
- [ ] Product detail page shows quality
- [ ] No performance degradation
- [ ] User experience improved

---

## 🐛 Bug Testing

### Edge Cases to Test

1. **Empty product name**: Should not crash
2. **No description**: Should still extract from name
3. **Invalid dimensions**: Should skip invalid values
4. **Missing material**: Should still match on other fields
5. **All data missing**: Should return low confidence
6. **Very long text**: Should not timeout
7. **Special characters**: Should handle gracefully
8. **Multiple dimension formats**: Should extract all

### Error Handling

1. **Supabase connection fails**: Should show error message
2. **Gemini API fails**: Should log error and continue
3. **Rate limit hit**: Should wait and retry
4. **Invalid JSON from AI**: Should catch and skip
5. **Database write fails**: Should log error

---

## 🎯 Success Criteria

### Minimum Requirements
- ✅ No crashes or errors
- ✅ Data quality improves by >20%
- ✅ Match scores improve by >15%
- ✅ Confidence scores are accurate
- ✅ Enrichment script works reliably

### Ideal Results
- ✅ Data quality improves by >50%
- ✅ Match scores improve by >30%
- ✅ "No results" rate drops by >50%
- ✅ User satisfaction increases
- ✅ RFQ conversion improves

---

## 📝 Test Report Template

```markdown
# Test Report - Product Recommender Improvements

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]

## Phase 1: Algorithm Improvements

### Multi-Source Extraction
- [ ] Tested
- [ ] Passed
- Notes: 

### Fuzzy Material Matching
- [ ] Tested
- [ ] Passed
- Notes:

### Adaptive Weights
- [ ] Tested
- [ ] Passed
- Notes:

### Confidence Scores
- [ ] Tested
- [ ] Passed
- Notes:

## Phase 2: AI Enrichment

### Audit Script
- [ ] Tested
- [ ] Passed
- Notes:

### Enrichment Dry Run
- [ ] Tested
- [ ] Passed
- Notes:

### Enrichment Live
- [ ] Tested
- [ ] Passed
- Notes:

### Data Quality Impact
- Before: [X]%
- After: [Y]%
- Improvement: [Z]%

## Integration Testing

### CAD Analyzer
- [ ] Tested
- [ ] Passed
- Notes:

### Product Recommender
- [ ] Tested
- [ ] Passed
- Notes:

### Product Detail
- [ ] Tested
- [ ] Passed
- Notes:

## Issues Found

1. [Issue description]
   - Severity: [High/Medium/Low]
   - Status: [Open/Fixed]

## Overall Assessment

- [ ] Ready for production
- [ ] Needs fixes
- [ ] Needs more testing

**Recommendation**: [Deploy/Hold/Revise]
```

---

## 🚀 Quick Test Commands

```bash
# Check current state
npm run audit-data

# Test enrichment (safe)
npm run enrich-data:dry-run

# Enrich 5 products
npx tsx scripts/enrich-product-data.ts --limit=5

# Check improvements
npm run audit-data

# Run app tests
npm test

# Start dev server
npm run dev
```

---

## 📞 Reporting Issues

If you find bugs:

1. **Document the issue**:
   - What you did
   - What you expected
   - What actually happened
   - Error messages

2. **Check logs**:
   - Browser console
   - Terminal output
   - Supabase logs

3. **Verify environment**:
   - `.env.local` configured correctly
   - Database accessible
   - API keys valid

4. **Create minimal reproduction**:
   - Simplest steps to reproduce
   - Sample data if needed

---

## ✅ Final Checklist

Before deploying to production:

- [ ] All Phase 1 tests pass
- [ ] All Phase 2 tests pass
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Data quality improved
- [ ] User experience improved
- [ ] Documentation complete
- [ ] Team trained on new features

---

**Ready to test?** Start with `npm run audit-data` to see your current state!
