#!/usr/bin/env tsx
/**
 * AI-Powered Product Data Enrichment Script
 * 
 * This script automatically fills missing product_specs data using AI analysis.
 * It extracts structured specifications from product names and descriptions.
 * 
 * Uses OpenRouter API with Mistral Devstral 2512 (FREE model).
 * 
 * Usage:
 *   npx tsx scripts/enrich-product-data.ts [--limit=50] [--dry-run]
 * 
 * Options:
 *   --limit=N     Process only N products (default: 50)
 *   --dry-run     Show what would be updated without making changes
 *   --force       Re-enrich products that already have specs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface EnrichmentResult {
  productId: string;
  productName: string;
  extractedSpecs: {
    width_mm?: number;
    height_mm?: number;
    depth_mm?: number;
    diameter_mm?: number;
    length_mm?: number;
    thickness_mm?: number;
    load_max_kn?: number;
    load_min_kn?: number;
  };
  materialFamily?: string;
  componentTypeId?: string;
  confidence: number;
  reasoning: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  specifications: any;
  category: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '50');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

console.log('🚀 Product Data Enrichment Script');
console.log('==================================');
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
console.log(`Limit: ${limit} products`);
console.log(`Force re-enrichment: ${force ? 'YES' : 'NO'}`);
console.log('');

async function main() {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ Missing OPENROUTER_API_KEY in .env.local');
    console.error('   Get your API key from: https://openrouter.ai/keys');
    process.exit(1);
  }

  // Initialize clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('✓ Connected to Supabase');
  console.log('✓ Connected to OpenRouter (Mistral Devstral - Free)');
  console.log('');

  // Get products with missing or incomplete specs
  console.log('📊 Analyzing product data completeness...');
  
  let query = supabase
    .from('products')
    .select('id, name, description, material, specifications, category');

  if (!force) {
    // Only get products without component_type_id or material_family
    query = query.or('component_type_id.is.null,material_family.is.null');
  }

  const { data: products, error } = await query.limit(limit);

  if (error) {
    console.error('❌ Failed to fetch products:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✓ No products need enrichment!');
    return;
  }

  console.log(`Found ${products.length} products to enrich\n`);

  // Process each product
  const results: EnrichmentResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as Product;
    console.log(`[${i + 1}/${products.length}] Processing: ${product.name}`);

    try {
      const enrichment = await enrichProduct(product);
      results.push(enrichment);

      if (!dryRun) {
        await saveEnrichment(supabase, enrichment);
      }

      console.log(`  ✓ Confidence: ${Math.round(enrichment.confidence * 100)}%`);
      console.log(`  ✓ ${enrichment.reasoning}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }

    console.log('');

    // Rate limiting: wait 1 second between requests
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('');
  console.log('📈 Enrichment Summary');
  console.log('====================');
  console.log(`Total processed: ${products.length}`);
  console.log(`✓ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (dryRun) {
    console.log('');
    console.log('ℹ️  This was a DRY RUN - no changes were made');
    console.log('   Run without --dry-run to apply changes');
  }
}

async function enrichProduct(
  product: Product
): Promise<EnrichmentResult> {
  const prompt = `You are a product data extraction expert. Extract structured specifications from this product information.

Product Name: ${product.name}
Description: ${product.description || 'N/A'}
Material: ${product.material || 'N/A'}
Category: ${product.category}
Existing Specifications: ${JSON.stringify(product.specifications || {})}

Extract the following information:

1. DIMENSIONS (in millimeters):
   - width_mm: Width in millimeters
   - height_mm: Height in millimeters
   - depth_mm: Depth in millimeters
   - diameter_mm: Diameter in millimeters (for cylindrical parts)
   - length_mm: Length in millimeters
   - thickness_mm: Thickness/wall thickness in millimeters

2. LOAD CAPACITY (in kilonewtons):
   - load_max_kn: Maximum load capacity in kN
   - load_min_kn: Minimum load capacity in kN

3. MATERIAL FAMILY:
   Choose ONE from: steel, aluminum, stainless, carbon, brass, copper, titanium, plastic, composite, other

4. COMPONENT TYPE:
   Identify the component type (e.g., beam, motor, fastener, bracket, plate, etc.)

5. CONFIDENCE:
   Rate your confidence in the extraction from 0.0 to 1.0

IMPORTANT RULES:
- Only include fields you are confident about (>70% confidence)
- Convert all dimensions to millimeters
- Convert all loads to kilonewtons
- If a dimension is not mentioned, omit it
- Be conservative - it's better to omit than to guess incorrectly

Return ONLY a valid JSON object with this structure:
{
  "dimensions": {
    "width_mm": number or null,
    "height_mm": number or null,
    "depth_mm": number or null,
    "diameter_mm": number or null,
    "length_mm": number or null,
    "thickness_mm": number or null
  },
  "load": {
    "load_max_kn": number or null,
    "load_min_kn": number or null
  },
  "material_family": "steel" | "aluminum" | etc. or null,
  "component_type": "beam" | "motor" | etc. or null,
  "confidence": number between 0 and 1,
  "reasoning": "Brief explanation of what was extracted"
}`;

  // Call OpenRouter API with Mistral Devstral (free model)
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'SteelSmart Product Enrichment',
    },
    body: JSON.stringify({
      model: 'mistralai/devstral-2512:free',
      messages: [
        {
          role: 'system',
          content: 'You are a product data extraction expert. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices[0].message.content;
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }

  const extracted = JSON.parse(jsonText);

  // Clean up dimensions (remove nulls)
  const cleanDimensions: any = {};
  if (extracted.dimensions) {
    Object.entries(extracted.dimensions).forEach(([key, value]) => {
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        cleanDimensions[key] = Number(value);
      }
    });
  }

  // Clean up load
  const cleanLoad: any = {};
  if (extracted.load) {
    Object.entries(extracted.load).forEach(([key, value]) => {
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        cleanLoad[key] = Number(value);
      }
    });
  }

  return {
    productId: product.id,
    productName: product.name,
    extractedSpecs: { ...cleanDimensions, ...cleanLoad },
    materialFamily: extracted.material_family || undefined,
    componentTypeId: undefined, // Will be mapped separately
    confidence: extracted.confidence || 0.5,
    reasoning: extracted.reasoning || 'Extracted from product information',
  };
}

async function saveEnrichment(
  supabase: any,
  enrichment: EnrichmentResult
): Promise<void> {
  // Update product_specs if we have dimension or load data
  if (Object.keys(enrichment.extractedSpecs).length > 0) {
    const { error: specsError } = await supabase
      .from('product_specs')
      .upsert({
        product_id: enrichment.productId,
        ...enrichment.extractedSpecs,
        confidence_score: enrichment.confidence,
        last_verified_at: new Date().toISOString(),
      }, {
        onConflict: 'product_id'
      });

    if (specsError) {
      throw new Error(`Failed to update product_specs: ${specsError.message}`);
    }
  }

  // Update product metadata
  const updates: any = {};
  if (enrichment.materialFamily) {
    updates.material_family = enrichment.materialFamily;
  }

  if (Object.keys(updates).length > 0) {
    const { error: productError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', enrichment.productId);

    if (productError) {
      throw new Error(`Failed to update product: ${productError.message}`);
    }
  }
}

// Run the script
main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
