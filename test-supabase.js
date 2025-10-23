// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fbxooowagcadiqpppniy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieG9vb3dhZ2NhZGlxcHBwbml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTUxNDIsImV4cCI6MjA3NjU3MTE0Mn0.w-7ixnYI78sRpEK-rzbUXbCMR0TmzDJ3qZNLfNfGDhU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  // Test 1: Check if profiles table exists
  console.log('\n📋 Test 1: Query profiles table')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Success! Found', data.length, 'profiles')
    console.log('Data:', JSON.stringify(data, null, 2))
  }
  
  // Test 2: Try to authenticate
  console.log('\n🔐 Test 2: Try authentication')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'infolegalge@gmail.com',
    password: 'Njkz295429!'
  })
  
  if (authError) {
    console.error('❌ Auth Error:', authError)
  } else {
    console.log('✅ Auth Success!')
    console.log('User ID:', authData.user.id)
    console.log('User Email:', authData.user.email)
    
    // Test 3: Query profile after auth
    console.log('\n👤 Test 3: Query user profile')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError)
    } else {
      console.log('✅ Profile Success!')
      console.log('Profile:', JSON.stringify(profileData, null, 2))
    }
  }
}

testConnection()
