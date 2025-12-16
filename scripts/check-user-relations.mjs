// Script to check all relations for a specific user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbxooowagcadiqpppniy.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieG9vb3dhZ2NhZGlxcHBwbml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NTE0MiwiZXhwIjoyMDc2NTcxMTQyfQ.xNGfdKzgttWpoDWAG3WX8tPu8cMkoYQRi4fVW7I81Mk'

const supabase = createClient(supabaseUrl, serviceRoleKey)

const userId = '6083c82a-0f06-49d4-8d3d-03bab7af96da'

async function checkRelations() {
  console.log(`\n=== Checking relations for user: ${userId} ===\n`)

  // 1. Profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  console.log('1. PROFILE:', profile ? `${profile.full_name} (${profile.role})` : 'NOT FOUND')

  // 2. Teams as leader
  const { data: teamsAsLeader } = await supabase
    .from('teams')
    .select('id, name')
    .eq('leader_id', userId)
  
  console.log('2. TEAMS (as leader):', teamsAsLeader?.length || 0, teamsAsLeader || [])

  // 3. Team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, team_id')
    .eq('profile_id', userId)
  
  console.log('3. TEAM_MEMBERS:', teamMembers?.length || 0, teamMembers || [])

  // 4. Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title')
    .eq('author_id', userId)
  
  console.log('4. POSTS:', posts?.length || 0, posts || [])

  // 5. Access requests
  const { data: accessRequests } = await supabase
    .from('access_requests')
    .select('id, request_type')
    .eq('user_id', userId)
  
  console.log('5. ACCESS_REQUESTS:', accessRequests?.length || 0)

  // 6. Specialist cities
  const { data: specialistCities } = await supabase
    .from('specialist_cities')
    .select('id, city_id')
    .eq('specialist_id', userId)
  
  console.log('6. SPECIALIST_CITIES:', specialistCities?.length || 0)

  // 7. Specialist services
  const { data: specialistServices } = await supabase
    .from('specialist_services')
    .select('id, service_id')
    .eq('profile_id', userId)
  
  console.log('7. SPECIALIST_SERVICES:', specialistServices?.length || 0)

  // 8. Specialist translations
  const { data: specialistTranslations } = await supabase
    .from('specialist_translations')
    .select('id, locale')
    .eq('specialist_id', userId)
  
  console.log('8. SPECIALIST_TRANSLATIONS:', specialistTranslations?.length || 0)

  // 9. Global messages
  const { data: globalMessages } = await supabase
    .from('global_messages')
    .select('id, title')
    .eq('created_by', userId)
  
  console.log('9. GLOBAL_MESSAGES:', globalMessages?.length || 0)

  // 10. User read messages
  const { data: userReadMessages } = await supabase
    .from('user_read_messages')
    .select('id')
    .eq('user_id', userId)
  
  console.log('10. USER_READ_MESSAGES:', userReadMessages?.length || 0)

  // 11. Legal pages
  const { data: legalPages } = await supabase
    .from('legal_pages')
    .select('id, slug')
    .eq('updated_by', userId)
  
  console.log('11. LEGAL_PAGES (updated_by):', legalPages?.length || 0)

  // 12. Access requests reviewed by
  const { data: reviewedRequests } = await supabase
    .from('access_requests')
    .select('id')
    .eq('reviewed_by', userId)
  
  console.log('12. ACCESS_REQUESTS (reviewed_by):', reviewedRequests?.length || 0)

  // 13. Profiles blocked by this user
  const { data: blockedProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('blocked_by', userId)
  
  console.log('13. PROFILES (blocked_by):', blockedProfiles?.length || 0)

  // 14. Profiles with company_id pointing to this user
  const { data: companyMembers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('company_id', userId)
  
  console.log('14. PROFILES (company_id):', companyMembers?.length || 0, companyMembers || [])

  console.log('\n=== Check complete ===\n')
}

checkRelations().catch(console.error)
