import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
  // 1. Find categories with services using the same query as main page
  const { data: categories, error: catError } = await supabase
    .from('service_categories')
    .select(`
      id,
      parent_id,
      service_category_translations!inner(name, slug, language),
      services:services!category_id(count)
    `)
    .eq('is_active', true)
    .eq('service_category_translations.language', 'ka')
  
  console.log('Category query error:', catError)
  
  const catsWithServices = categories?.filter(c => (c.services?.[0]?.count || 0) > 0) || []
  console.log('\n=== Categories with services ===')
  console.log('Total:', catsWithServices.length)
  
  catsWithServices.slice(0, 10).forEach(cat => {
    console.log(`- ${cat.service_category_translations[0]?.name}: ${cat.services[0].count} services`)
    console.log(`  ID: ${cat.id}`)
  })
  
  // 2. Pick one and test
  if (catsWithServices.length > 0) {
    const testCat = catsWithServices[0]
    console.log('\n=== Testing category:', testCat.service_category_translations[0]?.name, '===')
    console.log('Category ID:', testCat.id)
    
    // Direct query - without translation join
    const { data: directServices, error: directErr } = await supabase
      .from('services')
      .select('id, category_id, status')
      .eq('category_id', testCat.id)
    
    console.log('\nDirect query (no translation join):')
    console.log('Count:', directServices?.length)
    console.log('Error:', directErr)
    console.log('Sample:', directServices?.slice(0, 2))
    
    // With translation inner join - like the category page does
    const { data: joinedServices, error: joinErr } = await supabase
      .from('services')
      .select(`
        id,
        category_id,
        status,
        service_translations!inner(language, title)
      `)
      .eq('category_id', testCat.id)
      .eq('service_translations.language', 'ka')
    
    console.log('\nWith translation inner join:')
    console.log('Count:', joinedServices?.length)
    console.log('Error:', joinErr)
    console.log('Sample:', joinedServices?.slice(0, 2))
    
    // Check if these services have translations at all
    if (directServices && directServices.length > 0) {
      const serviceIds = directServices.map(s => s.id)
      const { data: translations } = await supabase
        .from('service_translations')
        .select('service_id, language, title')
        .in('service_id', serviceIds)
      
      console.log('\n=== Translations for these services ===')
      console.log('Total translations:', translations?.length)
      console.log('Sample:', translations?.slice(0, 3))
    }
  }
}

check()
