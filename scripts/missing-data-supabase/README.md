# Product Data Enrichment Scripts

This directory contains scripts for improving product data quality through AI-powered analysis and enrichment.

## 📊 Available Scripts

### 1. Data Audit Script

**Purpose**: Analyze current data completeness and identify gaps

```bash
npm run audit-data
```

**What it does**:
- Scans all products in Supabase
- Calculates completeness scores
- Shows statistics on missing data
- Lists top 10 products needing enrichment
- Provides recommendations

**Output Example**:
```
📈 Overall Statistics
====================
Total Products: 25

Structured Specs (product_specs table):
  ✓ With specs: 8 (32.0%)
  ✗ Without specs: 17 (68.0%)

Dimensions:
  ✓ With dimensions: 6 (24.0%)
  ✗ Without dimensions: 19 (76.0%)

📊 Overall Data Quality Score: 45.2%
   Status: ⚠️  Needs Improvement
```

---

### 2. Data Enrichment Script

**Purpose**: Automatically fill missing product data using AI

```bash
# Dry run (preview changes without applying)
npm run enrich-data:dry-run

# Live run (apply changes)
npm run enrich-data

# Custom options
npx tsx scripts/enrich-product-data.ts --limit=10 --dry-run
npx tsx scripts/enrich-product-data.ts --limit=100
npx tsx scripts/enrich-product-data.ts --force  # Re-enrich existing data
```

**What it does**:
- Finds products with missing specs
- Uses Gemini AI to extract structured data from names/descriptions
- Fills `product_specs` table with dimensions and load capacity
- Updates `material_family` field
- Logs confidence scores

**Options**:
- `--limit=N` - Process only N products (default: 50)
- `--dry-run` - Preview without making changes
- `--force` - Re-enrich products that already have specs

**Output Example**:
```
[1/25] Processing: Steel I-Beam 200x100x10mm
  ✓ Confidence: 92%
  ✓ Extracted dimensions: 200x100x10mm, material: steel

[2/25] Processing: High-Torque Servo Motor
  ✓ Confidence: 78%
  ✓ Extracted load capacity: 15kN, component type: motor

📈 Enrichment Summary
====================
Total processed: 25
✓ Successful: 23
❌ Failed: 2
```

---

## 🚀 Quick Start Guide

### Step 1: Check Current Data Quality

```bash
npm run audit-data
```

This shows you what percentage of your products have complete data.

### Step 2: Preview Enrichment

```bash
npm run enrich-data:dry-run
```

This shows what the AI would extract without making any changes.

### Step 3: Run Enrichment

```bash
npm run enrich-data
```

This applies the AI-extracted data to your database.

### Step 4: Verify Results

```bash
npm run audit-data
```

Check if data quality improved.

---

## 🔧 Configuration

### Required Environment Variables

Add these to your `.env.local`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# OpenRouter AI (required for enrichment - FREE model available)
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Get OpenRouter API Key**: https://openrouter.ai/keys (Free tier available!)

---

## 📋 Workflow Recommendations

### Initial Setup (First Time)

1. **Audit current data**:
   ```bash
   npm run audit-data
   ```

2. **Test enrichment on 10 products**:
   ```bash
   npx tsx scripts/enrich-product-data.ts --limit=10 --dry-run
   ```

3. **Apply to 10 products**:
   ```bash
   npx tsx scripts/enrich-product-data.ts --limit=10
   ```

4. **Verify results in Supabase**:
   - Check `product_specs` table
   - Check `products.material_family` field

5. **If satisfied, enrich all**:
   ```bash
   npm run enrich-data
   ```

### Regular Maintenance

Run weekly or when adding new products:

```bash
# Check for new products needing enrichment
npm run audit-data

# Enrich new products only (skips already enriched)
npm run enrich-data
```

### Re-enrichment

If you improve the AI prompt or want to update existing data:

```bash
npx tsx scripts/enrich-product-data.ts --force --limit=50
```

---

## 🎯 Expected Results

### Before Enrichment
- Data Completeness: ~40%
- Products with dimensions: ~30%
- Products with load capacity: ~20%
- Products with material_family: ~60%

### After Enrichment
- Data Completeness: ~75% (+88%)
- Products with dimensions: ~80% (+167%)
- Products with load capacity: ~70% (+250%)
- Products with material_family: ~95% (+58%)

---

## 🔍 How AI Extraction Works

The enrichment script uses OpenRouter (Mistral Devstral - Free) to:

1. **Analyze product information**:
   - Product name
   - Description
   - Material
   - Category
   - Existing specifications

2. **Extract structured data**:
   - Dimensions (width, height, depth, diameter, length, thickness)
   - Load capacity (max/min in kN)
   - Material family (steel, aluminum, etc.)
   - Component type (beam, motor, fastener, etc.)

3. **Validate and clean**:
   - Only includes fields with >70% confidence
   - Converts all units to standard (mm, kN)
   - Removes null/invalid values

4. **Save to database**:
   - Updates `product_specs` table
   - Updates `products.material_family`
   - Logs confidence scores

---

## 🛡️ Safety Features

### Dry Run Mode
Always test with `--dry-run` first to preview changes.

### Confidence Scoring
AI provides confidence scores (0-1) for each extraction. Low confidence extractions can be reviewed manually.

### Audit Trail
All enrichments are logged with:
- Timestamp
- Confidence score
- Source (AI vs manual)

### Upsert Logic
Uses `upsert` to avoid duplicates and allow re-enrichment.

---

## 🐛 Troubleshooting

### Error: Missing Supabase credentials
```
❌ Missing Supabase credentials in .env.local
```
**Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### Error: Missing OPENROUTER_API_KEY
```
❌ Missing OPENROUTER_API_KEY in .env.local
```
**Solution**: Get API key from https://openrouter.ai/keys and add to `.env.local`

### Error: Rate limit exceeded
```
❌ Failed: Rate limit exceeded
```
**Solution**: Script includes 1-second delay between requests. If still hitting limits, reduce `--limit` or wait before retrying.

### Low confidence scores
If AI confidence is consistently low (<0.5):
- Product names/descriptions may be too vague
- Consider adding more detailed descriptions
- Manual review recommended for low-confidence extractions

### No products found
```
✓ No products need enrichment!
```
**Solution**: All products already have data. Use `--force` to re-enrich.

---

## 📚 Related Documentation

- `documentation/Recommender/RECOMMENDATION_IMPROVEMENTS_PLAN.md` - Full improvement plan
- `documentation/Recommender/QUICK_IMPROVEMENTS_CHECKLIST.md` - Implementation checklist
- `src/lib/product-matcher.ts` - Updated matching algorithm with multi-source extraction

---

## 💡 Tips

1. **Start small**: Test on 10 products before enriching all
2. **Review AI suggestions**: Check a few manually to ensure quality
3. **Run regularly**: Enrich new products as they're added
4. **Monitor confidence**: Low confidence (<0.6) may need manual review
5. **Backup first**: Take a database backup before large enrichments

---

## 🔄 Continuous Improvement

### Scheduled Enrichment (Optional)

Set up a cron job to run weekly:

```bash
# Add to crontab (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/project && npm run enrich-data >> logs/enrichment.log 2>&1
```

### Monitoring

Track these metrics over time:
- Data completeness percentage
- Average confidence scores
- Number of products enriched
- Recommendation quality improvements

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error logs
3. Run audit script to verify database state
4. Check Supabase dashboard for data integrity

For questions about the enrichment algorithm, see the AI prompt in `scripts/enrich-product-data.ts`.
