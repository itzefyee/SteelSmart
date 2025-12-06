import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRoles() {
  console.log('👥 Checking User Roles\n');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, Role, company, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error.message);
      return;
    }

    // Get auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(authData.users.map(u => [u.id, u.email]));

    // Categorize by role
    const admins = profiles?.filter(p => p.Role?.toLowerCase() === 'admin') || [];
    const customers = profiles?.filter(p => p.Role?.toLowerCase() === 'customer') || [];

    console.log('👑 ADMIN USERS:');
    if (admins.length === 0) {
      console.log('   (none)');
    } else {
      admins.forEach(p => {
        console.log(`   - ${emailMap.get(p.id)}`);
        console.log(`     Company: ${p.company || 'N/A'}`);
      });
    }

    console.log('\n👤 CUSTOMER USERS:');
    if (customers.length === 0) {
      console.log('   (none)');
    } else {
      customers.forEach(p => {
        console.log(`   - ${emailMap.get(p.id)}`);
        console.log(`     Company: ${p.company || 'N/A'}`);
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${profiles?.length || 0}`);
    console.log(`   Admin: ${admins.length}`);
    console.log(`   Customer: ${customers.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserRoles();
