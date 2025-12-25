import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://fbxooowagcadiqpppniy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔍 Checking if hero_slides table exists...');
  
  // Check if table exists
  const { data: tables, error: checkError } = await supabase
    .from('hero_slides')
    .select('id')
    .limit(1);
  
  if (!checkError) {
    console.log('✅ hero_slides table already exists!');
    return;
  }
  
  if (checkError.code !== '42P01') { // 42P01 = table does not exist
    console.log('⚠️ Table check error:', checkError.message);
  }
  
  console.log('📦 hero_slides table does not exist. Creating...');
  
  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251225120000_create_hero_slides.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  console.log('🚀 Running migration...');
  
  // Execute SQL via RPC (if you have a function) or use raw query
  // Since we can't run raw SQL directly, let's check what we need
  console.log('⚠️ Cannot run raw SQL via JS client.');
  console.log('📋 Please run this SQL in Supabase Dashboard SQL Editor:');
  console.log('---');
  console.log('Go to: https://supabase.com/dashboard/project/fbxooowagcadiqpppniy/sql/new');
  console.log('---');
}

runMigration();
