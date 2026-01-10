/**
 * Script to assign category_id to services that don't have one
 * Run: node scripts/assign-service-categories.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (q) => new Promise(resolve => rl.question(q, resolve))

async function main() {
  console.log('\n=== Service Category Assignment Tool ===\n')
  
  // Get services without category_id that have translations
  const { data: services } = await supabase
    .from('services')
    .select(`
      id, 
      category_id, 
      status,
      service_translations!inner(title, language)
    `)
    .is('category_id', null)
    .eq('status', 'published')
    .eq('service_translations.language', 'ka')
    .order('created_at', { ascending: false })
  
  console.log(`Found ${services?.length || 0} published services without category\n`)
  
  if (!services || services.length === 0) {
    console.log('All services have categories assigned!')
    rl.close()
    return
  }
  
  // Get all categories
  const { data: categories } = await supabase
    .from('service_categories')
    .select(`
      id,
      parent_id,
      service_category_translations!inner(name, language)
    `)
    .eq('is_active', true)
    .eq('service_category_translations.language', 'ka')
    .order('sort_order')
  
  // Build category tree for display
  const parentCategories = categories?.filter(c => !c.parent_id) || []
  const childCategories = categories?.filter(c => c.parent_id) || []
  
  console.log('Available categories:\n')
  let categoryList = []
  let index = 1
  
  parentCategories.forEach(parent => {
    const name = parent.service_category_translations[0]?.name
    console.log(`${index}. ${name}`)
    categoryList.push({ index, id: parent.id, name })
    index++
    
    // Show children
    const children = childCategories.filter(c => c.parent_id === parent.id)
    children.forEach(child => {
      const childName = child.service_category_translations[0]?.name
      console.log(`   ${index}. └─ ${childName}`)
      categoryList.push({ index, id: child.id, name: `${name} > ${childName}` })
      index++
      
      // Show grandchildren
      const grandchildren = childCategories.filter(c => c.parent_id === child.id)
      grandchildren.forEach(gc => {
        const gcName = gc.service_category_translations[0]?.name
        console.log(`      ${index}. └─ ${gcName}`)
        categoryList.push({ index, id: gc.id, name: `${name} > ${childName} > ${gcName}` })
        index++
      })
    })
  })
  
  console.log('\n--- Services to assign ---\n')
  
  for (const service of services) {
    const title = service.service_translations[0]?.title
    console.log(`\nService: "${title}"`)
    console.log(`ID: ${service.id}`)
    
    const answer = await question('Enter category number (or "s" to skip, "q" to quit): ')
    
    if (answer.toLowerCase() === 'q') {
      console.log('Exiting...')
      break
    }
    
    if (answer.toLowerCase() === 's') {
      console.log('Skipped')
      continue
    }
    
    const catIndex = parseInt(answer)
    const selectedCat = categoryList.find(c => c.index === catIndex)
    
    if (selectedCat) {
      const { error } = await supabase
        .from('services')
        .update({ category_id: selectedCat.id })
        .eq('id', service.id)
      
      if (error) {
        console.log('Error:', error.message)
      } else {
        console.log(`✓ Assigned to: ${selectedCat.name}`)
      }
    } else {
      console.log('Invalid category number, skipped')
    }
  }
  
  console.log('\nDone!')
  rl.close()
}

main().catch(console.error)
