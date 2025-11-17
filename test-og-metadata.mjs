import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '.env.local') })

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSpecialistMetadata(slug, locale = 'ka') {
  console.log('\n🔍 Testing Specialist OG Metadata...')
  console.log('━'.repeat(60))
  console.log(`Slug: ${slug}`)
  console.log(`Locale: ${locale}`)
  console.log('━'.repeat(60))

  // Fetch specialist data (იგივე query რაც page.tsx-ში)
  const { data: specialistData, error } = await supabase
    .from('specialist_translations')
    .select(`
      full_name,
      role_title,
      bio,
      slug,
      language,
      specialist_id,
      social_title,
      social_description,
      social_image_url,
      seo_title,
      seo_description,
      profiles!inner(
        avatar_url,
        company_id,
        role
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (error || !specialistData) {
    console.error('❌ Error fetching data:', error)
    return
  }

  // Extract profile data
  const specialist = {
    ...specialistData,
    profiles: Array.isArray(specialistData.profiles) 
      ? specialistData.profiles[0] 
      : specialistData.profiles
  }

  console.log('\n📊 Database Data:')
  console.log('━'.repeat(60))
  console.log('Full Name:', specialist.full_name)
  console.log('Social Title:', specialist.social_title || '❌ NULL')
  console.log('Social Description:', specialist.social_description || '❌ NULL')
  console.log('Social Image URL:', specialist.social_image_url || '❌ NULL')
  console.log('SEO Title:', specialist.seo_title || '❌ NULL')
  console.log('SEO Description:', specialist.seo_description || '❌ NULL')
  console.log('Avatar URL:', specialist.profiles?.avatar_url || '❌ NULL')

  // Generate OG metadata (იგივე logic რაც page.tsx-ში)
  const baseUrl = 'https://www.legal.ge'
  
  const title = specialist.role_title
    ? `${specialist.full_name}, ${specialist.role_title} | Legal`
    : `${specialist.full_name} | Legal`

  const description = specialist.bio
    ? specialist.bio.substring(0, 160) + (specialist.bio.length > 160 ? '...' : '')
    : `Professional profile of ${specialist.full_name} on Legal.`

  const socialImageUrl = specialist.social_image_url || specialist.profiles?.avatar_url
  
  let ogImage
  if (socialImageUrl) {
    if (socialImageUrl.startsWith('http')) {
      ogImage = socialImageUrl
    } else {
      ogImage = `${supabaseUrl}/storage/v1/object/public/specialist-social-images/${socialImageUrl}`
    }
  } else {
    ogImage = `${baseUrl}/asset/images/og-image.jpg`
  }

  const ogTitle = specialist.social_title || specialist.seo_title || title
  const ogDescription = specialist.social_description || specialist.seo_description || description

  console.log('\n🎯 Generated OG Metadata:')
  console.log('━'.repeat(60))
  console.log('og:title:', ogTitle)
  console.log('og:description:', ogDescription)
  console.log('og:image:', ogImage)

  console.log('\n✅ Validation:')
  console.log('━'.repeat(60))
  console.log('✓ Title populated:', ogTitle ? '✅' : '❌')
  console.log('✓ Description populated:', ogDescription ? '✅' : '❌')
  console.log('✓ Image is absolute URL:', ogImage?.startsWith('http') ? '✅' : '❌')
  console.log('✓ Image from correct source:', 
    socialImageUrl === specialist.social_image_url ? '✅ specialist_translations' : 
    socialImageUrl === specialist.profiles?.avatar_url ? '⚠️  fallback to avatar_url' : '❌')

  console.log('\n📋 Facebook Debugger Preview:')
  console.log('━'.repeat(60))
  console.log(`URL: ${baseUrl}/${locale}/specialists/${slug}`)
  console.log(`\n<meta property="og:title" content="${ogTitle}" />`)
  console.log(`<meta property="og:description" content="${ogDescription}" />`)
  console.log(`<meta property="og:image" content="${ogImage}" />`)
  console.log('━'.repeat(60))

  return {
    success: true,
    data: {
      ogTitle,
      ogDescription,
      ogImage,
      source: {
        title: specialist.social_title ? 'social_title' : specialist.seo_title ? 'seo_title' : 'generated',
        description: specialist.social_description ? 'social_description' : specialist.seo_description ? 'seo_description' : 'generated',
        image: specialist.social_image_url ? 'social_image_url' : specialist.profiles?.avatar_url ? 'avatar_url' : 'default'
      }
    }
  }
}

// ტესტის გაშვება
const testSlug = process.argv[2] || 'liana-zagashvili-ka'
const testLocale = process.argv[3] || 'ka'

testSpecialistMetadata(testSlug, testLocale)
  .then(() => {
    console.log('\n✅ Test completed!\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err)
    process.exit(1)
  })
