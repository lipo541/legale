// Hero Slides მიგრაციის გაშვება Supabase-ზე
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbxooowagcadiqpppniy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieG9vb3dhZ2NhZGlxcHBwbml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NTE0MiwiZXhwIjoyMDc2NTcxMTQyfQ.xNGfdKzgttWpoDWAG3WX8tPu8cMkoYQRi4fVW7I81Mk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runHeroMigration() {
  console.log('🚀 Hero Slides მიგრაციის დაწყება...\n');

  // 1. შევქმნათ hero_slides ტაბლა
  console.log('1️⃣ hero_slides ტაბლის შექმნა...');
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS hero_slides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_url_light TEXT NOT NULL,
        image_url_dark TEXT NOT NULL,
        title_ka TEXT NOT NULL,
        description_ka TEXT,
        title_en TEXT NOT NULL,
        description_en TEXT,
        title_ru TEXT NOT NULL,
        description_ru TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
      );
    `
  });
  
  if (error1) {
    // rpc არ მუშაობს, სხვა გზა ვცადოთ
    console.log('⚠️ RPC არ მუშაობს, ვცდილობთ სხვა მეთოდს...');
  }

  // ვცადოთ ტაბლის არსებობის შემოწმება
  const { data, error: checkError } = await supabase
    .from('hero_slides')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('❌ ტაბლა არ არსებობს. გთხოვთ გაუშვათ SQL Dashboard-დან.');
    console.log('\n📋 გადადი ამ ლინკზე:');
    console.log('https://supabase.com/dashboard/project/fbxooowagcadiqpppniy/sql/new');
    console.log('\nდა გაუშვი SQL ფაილიდან: supabase/migrations/20251225120000_create_hero_slides.sql');
  } else if (!checkError) {
    console.log('✅ hero_slides ტაბლა უკვე არსებობს!');
  } else {
    console.log('შეცდომა:', checkError.message);
  }
}

runHeroMigration();
