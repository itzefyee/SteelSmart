import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .order('category')
    .returns<{ category: string }[]>();

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const categories = Array.from(new Set((data || []).map((row) => row.category)));
  console.log(categories);
}

main();

