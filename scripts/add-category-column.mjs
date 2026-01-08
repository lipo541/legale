import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCategoryIdToServices() {
  console.log('Adding category_id column to services table...\n');

  // Try to add column via postgrest
  // We can't run DDL directly, but we can use the SQL function if it exists
  // Or we need to use psql
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: `ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;`
    })
  });

  if (!response.ok) {
    console.log('exec_sql function not available (expected)');
    console.log('\nRun this SQL manually in Supabase Dashboard:\n');
    console.log(`
-- Add category_id column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
    `);
    console.log('\n\nAlternatively, go to Table Editor → services → Edit Table → Add Column:');
    console.log('  Name: category_id');
    console.log('  Type: uuid');
    console.log('  Default: (leave empty)');
    console.log('  Foreign Key: service_categories.id');
    return;
  }

  console.log('✅ Column added successfully!');
}

addCategoryIdToServices().catch(console.error);
