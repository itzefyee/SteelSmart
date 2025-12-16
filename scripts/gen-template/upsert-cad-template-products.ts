import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type TemplateProduct = {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  description: string;
  technical_details: string;
  lead_time: string;
  in_stock: boolean;
  specifications: Record<string, string>;
  compatible_with: string[];
  imagesFolder: string;
};

const products: TemplateProduct[] = [
  {
    id: 'steel-beam-001',
    name: 'I-Beam Steel 200x100mm',
    category: 'structural',
    material: 'Grade S355 Structural Steel',
    price: 156.75,
    description:
      'Standard S355 structural I-beam with 12" length, 4" web height, and optimized flange thickness for medium span frames.',
    technical_details:
      'Hot rolled, stress relieved, 0.29" flange thickness, 0.19" web thickness, 0.46" root radius, shot blasted & primed.',
    lead_time: '5-7 business days',
    in_stock: true,
    specifications: {
      dimensions: 'Length 12 in • Height 4 in • Flange 2.66 in',
      weight: '89.4 kg/m',
      loadCapacity: '120 kN/m² design load',
      tolerance: '±0.5 mm rolled tolerance',
      operatingTemp: '-40°C to +200°C',
    },
    compatible_with: ['connection-bracket-001', 'steel-plate-001', 'hex-bolt-m12'],
    imagesFolder: 'steel-beam-001',
  },
  {
    id: 'surgical-drill-guide-001',
    name: 'Surgical Drill Guide 150mm Handle',
    category: 'custom',
    material: 'Surgical Grade Stainless Steel',
    price: 495,
    description:
      'Precision surgical drill guide featuring twin rotating bit mounts for Ø2 mm and Ø3.2 mm instrumentation.',
    technical_details:
      '150 mm ergonomic handle, autoclavable to 134°C, twin bit carriers with locking sleeves, laser-etched depth markings.',
    lead_time: '7-9 business days',
    in_stock: true,
    specifications: {
      dimensions: '150 mm handle • Twin Ø2 / Ø3.2 mm sleeves',
      weight: '0.45 kg assembly',
      loadCapacity: 'Manual surgical guidance',
      tolerance: 'Sleeve runout ±0.02 mm',
      operatingTemp: 'Autoclave safe to 134°C',
    },
    compatible_with: ['custom-bracket-001', 'mounting-bracket-001'],
    imagesFolder: 'surgical_drill_guide',
  },
  {
    id: 'gallows-frame-001',
    name: 'Gallows Frame 2400 x 1250 x 450 mm',
    category: 'structural',
    material: 'Hot Dip Galvanized Steel',
    price: 1420,
    description:
      'Heavy-duty gallows frame built from angle iron with six integrated brackets for modular lifting systems.',
    technical_details:
      'Angle iron construction, 6 removable brackets, pre-drilled for M12 hardware, supplied with leveling feet.',
    lead_time: '10-12 business days',
    in_stock: false,
    specifications: {
      dimensions: '2400 x 1250 x 450 mm envelope',
      weight: '180 kg assembled',
      loadCapacity: 'Safe working load 8 kN',
      tolerance: 'Frame squareness ±2 mm',
      operatingTemp: '-20°C to +80°C',
    },
    compatible_with: ['steel-beam-001', 'steel-angle-001', 'connection-bracket-001'],
    imagesFolder: 'gallows_frame',
  },
  {
    id: 'brake-rotor-001',
    name: 'Brake Rotor 320mm Vented 5x114.3',
    category: 'structural',
    material: 'High Carbon Cast Iron',
    price: 215,
    description:
      '320 mm vented brake rotor with 5x114.3 bolt pattern and machined M12 stud bores for motorsport-grade stopping power.',
    technical_details:
      'Vented twin-disc construction, 5x M12 bolt holes on 114.3 mm PCD, dynamically balanced, heat-treated to 650°C.',
    lead_time: '4-6 business days',
    in_stock: true,
    specifications: {
      dimensions: 'Ø320 mm x 32 mm vented rotor',
      weight: '9.2 kg per rotor',
      loadCapacity: 'Clamp load up to 45 kN',
      tolerance: 'Face runout ≤ 0.03 mm',
      operatingTemp: 'Up to 650°C continuous',
    },
    compatible_with: ['hex-bolt-m12', 'hex-nut-m12', 'washer-m12'],
    imagesFolder: 'brake_rotor',
  },
];

const viewPriority: Record<string, number> = {
  'preview.png': 1000,
  'iso-front-top-right.png': 100,
  'iso-front-top-left.png': 95,
  'iso-front-bottom-right.png': 90,
  'iso-front-bottom-left.png': 85,
  'iso-back-top-right.png': 80,
  'iso-back-bottom-left.png': 75,
  'front.png': 50,
  'back.png': 45,
  'top.png': 40,
  'bottom.png': 35,
  'left.png': 30,
  'right.png': 25,
};

async function getImageUrls(folder: string): Promise<string[]> {
  const { data: files, error } = await supabase.storage
    .from('product-images')
    .list(`products/${folder}`, {
      limit: 50,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error || !files) {
    console.warn(`⚠️  Unable to list files for folder ${folder}: ${error?.message}`);
    return [];
  }

  return files
    .filter((file) => file.name.match(/\.(png|jpg|jpeg)$/i))
    .sort((a, b) => {
      const ap = viewPriority[a.name] ?? 0;
      const bp = viewPriority[b.name] ?? 0;
      return bp - ap;
    })
    .map((file) => {
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${folder}/${file.name}`);
      return data.publicUrl;
    });
}

async function upsertProducts() {
  for (const product of products) {
    const images = await getImageUrls(product.imagesFolder);

    if (images.length === 0) {
      console.warn(`⚠️  Skipping ${product.id} - no images found in ${product.imagesFolder}`);
      continue;
    }

    const { imagesFolder, ...payload } = product;
    const { error } = await supabase
      .from('products')
      .upsert({
        ...payload,
        images,
        specifications: payload.specifications,
        compatible_with: payload.compatible_with,
      });

    if (error) {
      console.error(`❌ Failed to upsert ${product.id}: ${error.message}`);
    } else {
      console.log(`✅ Upserted ${product.id}`);
    }
  }
}

upsertProducts()
  .then(() => {
    console.log('🎯 Product sync complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error', error);
    process.exit(1);
  });

