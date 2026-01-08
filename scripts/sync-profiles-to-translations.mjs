/**
 * Migration Script: Sync profiles data to specialist_translations (Georgian)
 * 
 * This script copies existing specialist data from profiles table
 * to specialist_translations table (ka language) where the translation
 * fields are empty but profile fields have data.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fbxooowagcadiqpppniy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieG9vb3dhZ2NhZGlxcHBwbml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NTE0MiwiZXhwIjoyMDc2NTcxMTQyfQ.xNGfdKzgttWpoDWAG3WX8tPu8cMkoYQRi4fVW7I81Mk'
)

async function syncProfilesToTranslations() {
  console.log('🔄 Starting profiles → specialist_translations (ka) sync...\n')

  // 1. Get all specialists (SPECIALIST and SOLO_SPECIALIST)
  const { data: specialists, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])

  if (fetchError) {
    console.error('❌ Error fetching specialists:', fetchError)
    return
  }

  console.log(`📋 Found ${specialists.length} specialists\n`)

  let synced = 0
  let skipped = 0
  let errors = 0

  for (const specialist of specialists) {
    // 2. Check existing Georgian translation
    const { data: existingTrans } = await supabase
      .from('specialist_translations')
      .select('*')
      .eq('specialist_id', specialist.id)
      .eq('language', 'ka')
      .single()

    // Fields to sync
    const fieldsToSync = {
      full_name: specialist.full_name,
      role_title: specialist.role_title,
      bio: specialist.bio,
      philosophy: specialist.philosophy,
      teaching_writing_speaking: specialist.teaching_writing_speaking,
      focus_areas: specialist.focus_areas || [],
      representative_matters: specialist.representative_matters || [],
      credentials_memberships: specialist.credentials_memberships || [],
      values_how_we_work: specialist.values_how_we_work || {},
      avatar_alt_text: specialist.avatar_alt_text,
      seo_title: specialist.seo_title,
      seo_description: specialist.seo_description,
      seo_keywords: specialist.seo_keywords,
      social_title: specialist.social_title,
      social_description: specialist.social_description,
      social_hashtags: specialist.social_hashtags,
      social_image_url: specialist.social_image_url
    }

    // Check if profile has any non-empty content to sync
    const hasContent = fieldsToSync.bio || fieldsToSync.role_title || fieldsToSync.philosophy

    if (!hasContent) {
      console.log(`⏭️  ${specialist.full_name || specialist.id}: No content to sync`)
      skipped++
      continue
    }

    // Prepare update data - only update empty fields in translation
    const updateData = { specialist_id: specialist.id, language: 'ka' }
    let needsUpdate = false

    for (const [key, value] of Object.entries(fieldsToSync)) {
      if (value !== null && value !== undefined && value !== '') {
        // Check if translation field is empty
        const transValue = existingTrans?.[key]
        const isEmpty = transValue === null || transValue === undefined || transValue === '' ||
                       (Array.isArray(transValue) && transValue.length === 0) ||
                       (typeof transValue === 'object' && !Array.isArray(transValue) && Object.keys(transValue).length === 0)

        if (isEmpty) {
          updateData[key] = value
          needsUpdate = true
        }
      }
    }

    if (!needsUpdate) {
      console.log(`✓ ${specialist.full_name || specialist.id}: Already synced`)
      skipped++
      continue
    }

    // 3. Upsert to specialist_translations
    const { error: upsertError } = await supabase
      .from('specialist_translations')
      .upsert(updateData, { onConflict: 'specialist_id,language' })

    if (upsertError) {
      console.error(`❌ ${specialist.full_name || specialist.id}: Error -`, upsertError.message)
      errors++
    } else {
      console.log(`✅ ${specialist.full_name || specialist.id}: Synced successfully`)
      synced++
    }
  }

  console.log('\n========================================')
  console.log(`✅ Synced: ${synced}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('========================================\n')
}

syncProfilesToTranslations()
