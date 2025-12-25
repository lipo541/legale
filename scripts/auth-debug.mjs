/**
 * Auth Debug Script - Node.js
 * 
 * ეს სკრიპტი ამოწმებს Supabase auth კონფიგურაციას და პრობლემებს
 * 
 * გაშვება: node scripts/auth-debug.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// Colors for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
}

async function main() {
  log.section('🔍 AUTH DEBUG SCRIPT')
  
  // 1. Check environment variables
  log.section('1. Environment Variables Check')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    log.error('NEXT_PUBLIC_SUPABASE_URL is not set')
    process.exit(1)
  }
  log.success(`Supabase URL: ${supabaseUrl}`)

  if (!supabaseAnonKey) {
    log.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    process.exit(1)
  }
  log.success(`Anon Key: ${supabaseAnonKey.substring(0, 30)}...`)

  if (supabaseServiceKey) {
    log.success(`Service Key: ${supabaseServiceKey.substring(0, 30)}...`)
  } else {
    log.warning('SUPABASE_SERVICE_ROLE_KEY is not set (optional)')
  }

  // 2. Parse JWT to check configuration
  log.section('2. JWT Configuration Analysis')
  
  try {
    const [header, payload] = supabaseAnonKey.split('.').slice(0, 2)
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    
    log.info(`Project Reference: ${decodedPayload.ref || 'N/A'}`)
    log.info(`Role: ${decodedPayload.role || 'N/A'}`)
    log.info(`Issued At: ${decodedPayload.iat ? new Date(decodedPayload.iat * 1000).toISOString() : 'N/A'}`)
    log.info(`Expires: ${decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : 'Never'}`)
    
    // Check if token is expired
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
      log.error('⚠️  ANON KEY IS EXPIRED!')
    }
  } catch (e) {
    log.warning(`Could not decode JWT: ${e.message}`)
  }

  // 3. Test Supabase connection
  log.section('3. Supabase Connection Test')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    const duration = Date.now() - startTime
    
    if (error) {
      log.error(`Database connection failed: ${error.message}`)
      log.info(`Error code: ${error.code}`)
      log.info(`Error details: ${JSON.stringify(error.details)}`)
    } else {
      log.success(`Database connected successfully (${duration}ms)`)
    }
  } catch (e) {
    log.error(`Connection exception: ${e.message}`)
  }

  // 4. Check auth configuration
  log.section('4. Auth Configuration')
  
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]
  
  if (projectRef) {
    log.info(`Project Reference: ${projectRef}`)
    log.info(`Expected cookie name pattern: sb-${projectRef}-auth-token`)
  }

  // 5. Known issues check
  log.section('5. Known Issues Check')
  
  // Check for common configuration issues
  const issues = []
  
  // Check URL format
  if (!supabaseUrl.startsWith('https://')) {
    issues.push('Supabase URL should use HTTPS')
  }
  
  if (supabaseUrl.includes('localhost')) {
    issues.push('Using localhost Supabase - make sure local instance is running')
  }
  
  if (issues.length > 0) {
    issues.forEach(issue => log.warning(issue))
  } else {
    log.success('No obvious configuration issues found')
  }

  // 6. Cookie analysis
  log.section('6. Cookie Configuration Analysis')
  
  log.info('For Supabase SSR, cookies should:')
  log.info('  - NOT have a hardcoded domain for localhost')
  log.info('  - Have SameSite=Lax for OAuth flow')
  log.info('  - Be httpOnly for security')
  log.info('  - Have path=/')
  
  log.warning('Check server.ts for any hardcoded domain settings')
  log.warning('Domain should be empty/undefined for localhost development')

  // 7. Auth flow analysis
  log.section('7. Tab Visibility Issue Analysis')
  
  log.info('When tab becomes visible, these things happen:')
  log.info('  1. AuthContext visibility handler fires')
  log.info('  2. /api/auth/refresh is called')
  log.info('  3. Server validates session from cookies')
  log.info('  4. If valid, session continues')
  log.info('  5. If invalid, user is logged out')
  log.info('')
  log.warning('Possible issues:')
  log.warning('  - Cookies not being sent (domain mismatch)')
  log.warning('  - Session expired on Supabase side')
  log.warning('  - Multiple refresh calls racing')
  log.warning('  - Browser clearing cookies')
  
  // 8. Recommendations
  log.section('8. Recommendations')
  
  console.log(`
${colors.cyan}რეკომენდაციები პრობლემის მოსაგვარებლად:${colors.reset}

1. ${colors.yellow}AuthDebugPanel გამოყენება:${colors.reset}
   - დაამატე layout.tsx-ში: import AuthDebugPanel from '@/components/common/AuthDebugPanel'
   - და JSX-ში: <AuthDebugPanel />
   - გახსენი dev tools და დააკვირდი logs-ს ტაბის ცვლილებისას

2. ${colors.yellow}Browser DevTools:${colors.reset}
   - გახსენი Application > Cookies
   - შეამოწმე sb-*-auth-token cookie არსებობს
   - შეამოწმე domain ცარიელია localhost-ისთვის

3. ${colors.yellow}Network Tab:${colors.reset}
   - გააკეთე preserve log
   - შეცვალე ტაბი და უკან დაბრუნდი
   - ნახე /api/auth/refresh request და response

4. ${colors.yellow}Console:${colors.reset}
   - მოძებნე [AuthProvider] prefixed messages
   - ნახე რა events ჩნდება visibility change-ზე

5. ${colors.yellow}Session Check:${colors.reset}
   - Supabase Dashboard > Authentication > Users
   - შეამოწმე user-ის last_sign_in_at
`)

  log.section('Script Complete')
}

// Load .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

main().catch(console.error)
