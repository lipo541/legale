import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running Service Categories Migration...\n');

  // Step 1: Create service_categories table
  console.log('Step 1: Creating service_categories table...');
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS service_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `
  });
  
  if (error1) {
    // Try direct query
    const { error: directError1 } = await supabase.from('service_categories').select('id').limit(1);
    if (directError1 && directError1.code === '42P01') {
      console.log('  Table does not exist, needs manual creation');
    } else if (!directError1) {
      console.log('  ✓ Table already exists');
    }
  } else {
    console.log('  ✓ Done');
  }

  // Check if table exists
  const { data: checkTable, error: checkError } = await supabase
    .from('service_categories')
    .select('id')
    .limit(1);
  
  if (checkError && checkError.code === '42P01') {
    console.log('\n❌ service_categories table does not exist.');
    console.log('\nPlease run this SQL in Supabase Dashboard SQL Editor:\n');
    console.log(`
-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_category_translations table  
CREATE TABLE IF NOT EXISTS service_category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category_id, language),
    UNIQUE(slug, language)
);

-- Add category_id to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_category_translations ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read service_categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read service_category_translations" ON service_category_translations FOR SELECT USING (true);

-- Admin access
CREATE POLICY "Admin service_categories" ON service_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "Admin service_category_translations" ON service_category_translations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Grants
GRANT SELECT ON service_categories TO anon;
GRANT SELECT ON service_category_translations TO anon;
GRANT ALL ON service_categories TO authenticated;
GRANT ALL ON service_category_translations TO authenticated;
    `);
    return;
  }

  console.log('\n✅ service_categories table exists!');
  
  // Check translations table
  const { error: checkTrans } = await supabase
    .from('service_category_translations')
    .select('id')
    .limit(1);
  
  if (checkTrans && checkTrans.code === '42P01') {
    console.log('❌ service_category_translations table does not exist');
  } else {
    console.log('✅ service_category_translations table exists!');
  }

  // Check services.category_id column
  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('category_id')
    .limit(1);
  
  if (servicesError && servicesError.message.includes('category_id')) {
    console.log('❌ services.category_id column does not exist');
  } else {
    console.log('✅ services.category_id column exists!');
  }

  console.log('\n🎉 Migration verification complete!');
}

runMigration().catch(console.error);
