#!/usr/bin/env node
/**
 * 🔍 COMPREHENSIVE SEO & CODE AUDIT
 * Full analysis of:
 * - All page files metadata
 * - Sitemap validation
 * - Internal/external links
 * - Canonical URLs
 * - hreflang tags
 * - OpenGraph/Twitter cards
 * - Structured data (JSON-LD)
 * - Code quality
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const SITE_URL = 'https://legal.ge'
const LOCALES = ['ka', 'en', 'ru']

// Colors
const c = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

// Results storage
const results = {
  pages: { total: 0, withMeta: 0, withCanonical: 0, withOG: 0, withHreflang: 0 },
  sitemap: { urls: 0, valid: 0, errors: [] },
  links: { internal: 0, external: 0, broken: [] },
  issues: { critical: [], warning: [], info: [] }
}

// Helper functions
const log = {
  header: (text) => console.log(`\n${c.bold}${c.cyan}═══════════════════════════════════════════════════════════${c.reset}`),
  section: (text) => console.log(`\n${c.bold}${c.blue}▸ ${text}${c.reset}`),
  success: (text) => console.log(`  ${c.green}✓${c.reset} ${text}`),
  error: (text) => console.log(`  ${c.red}✗${c.reset} ${text}`),
  warning: (text) => console.log(`  ${c.yellow}⚠${c.reset} ${text}`),
  info: (text) => console.log(`  ${c.dim}ℹ${c.reset} ${text}`),
  progress: (current, total, text) => {
    const pct = Math.round((current / total) * 100)
    process.stdout.write(`\r  ${c.dim}[${pct}%]${c.reset} ${text}...`)
  }
}

// ═══════════════════════════════════════════════════════════
// 1. ANALYZE ALL PAGE FILES
// ═══════════════════════════════════════════════════════════

function findAllFiles(dir, pattern, files = []) {
  if (!fs.existsSync(dir)) return files
  
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findAllFiles(fullPath, pattern, files)
    } else if (pattern.test(item)) {
      files.push(fullPath)
    }
  }
  return files
}

function analyzePageFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(projectRoot, filePath)
  
  // Skip dashboard and auth pages (blocked in robots.txt)
  const skipPatterns = [
    'dashboard', 'admin', 'login', 'register', 
    'complete-profile', 'messages', 'not_found'
  ]
  if (skipPatterns.some(p => relativePath.toLowerCase().includes(p))) {
    return null // Skip these pages
  }
  
  const analysis = {
    file: relativePath,
    hasMetadata: false,
    hasGenerateMetadata: false,
    hasCanonical: false,
    hasAlternates: false,
    hasOpenGraph: false,
    hasTwitter: false,
    hasJsonLd: false,
    issues: []
  }
  
  // Check metadata
  analysis.hasGenerateMetadata = /export\s+(async\s+)?function\s+generateMetadata/.test(content)
  analysis.hasMetadata = content.includes('export const metadata') || analysis.hasGenerateMetadata
  
  if (analysis.hasMetadata || analysis.hasGenerateMetadata) {
    analysis.hasCanonical = content.includes('canonical')
    analysis.hasAlternates = content.includes('alternates') && content.includes('languages')
    analysis.hasOpenGraph = content.includes('openGraph')
    analysis.hasTwitter = content.includes('twitter')
  }
  
  // Check JSON-LD
  analysis.hasJsonLd = content.includes('application/ld+json')
  
  // Identify issues
  if (!analysis.hasMetadata) {
    analysis.issues.push({ level: 'critical', msg: 'No metadata export' })
  } else {
    if (!analysis.hasCanonical) {
      analysis.issues.push({ level: 'warning', msg: 'Missing canonical URL' })
    }
    if (!analysis.hasAlternates) {
      analysis.issues.push({ level: 'warning', msg: 'Missing hreflang alternates' })
    }
    if (!analysis.hasOpenGraph) {
      analysis.issues.push({ level: 'warning', msg: 'Missing OpenGraph tags' })
    }
  }
  
  return analysis
}

async function analyzeAllPages() {
  log.section('PAGE FILES ANALYSIS')
  
  const appDir = path.join(projectRoot, 'src', 'app')
  const pageFiles = findAllFiles(appDir, /page\.tsx$/)
  
  let analyzed = 0
  let withMeta = 0
  let withCanonical = 0
  let withOG = 0
  let withHreflang = 0
  const pageIssues = []
  
  for (const file of pageFiles) {
    const analysis = analyzePageFile(file)
    if (!analysis) continue // Skipped
    
    analyzed++
    if (analysis.hasMetadata) withMeta++
    if (analysis.hasCanonical) withCanonical++
    if (analysis.hasOpenGraph) withOG++
    if (analysis.hasAlternates) withHreflang++
    
    if (analysis.issues.length > 0) {
      pageIssues.push(analysis)
    }
  }
  
  console.log(`  Found ${pageFiles.length} page files, analyzed ${analyzed} (excluding blocked)`)
  console.log(`  ${c.green}✓${c.reset} With metadata: ${withMeta}/${analyzed}`)
  console.log(`  ${c.green}✓${c.reset} With canonical: ${withCanonical}/${analyzed}`)
  console.log(`  ${c.green}✓${c.reset} With OpenGraph: ${withOG}/${analyzed}`)
  console.log(`  ${c.green}✓${c.reset} With hreflang: ${withHreflang}/${analyzed}`)
  
  if (pageIssues.length > 0) {
    console.log(`\n  ${c.yellow}Pages with issues:${c.reset}`)
    for (const page of pageIssues) {
      console.log(`    ${c.dim}${page.file}${c.reset}`)
      for (const issue of page.issues) {
        const color = issue.level === 'critical' ? c.red : c.yellow
        console.log(`      ${color}• ${issue.msg}${c.reset}`)
        results.issues[issue.level].push(`${page.file}: ${issue.msg}`)
      }
    }
  }
  
  results.pages = { total: analyzed, withMeta, withCanonical, withOG, withHreflang }
}

// ═══════════════════════════════════════════════════════════
// 2. VALIDATE SITEMAP
// ═══════════════════════════════════════════════════════════

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

async function validateSitemap() {
  log.section('SITEMAP VALIDATION')
  
  try {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`
    console.log(`  Fetching ${sitemapUrl}...`)
    
    const response = await fetchUrl(sitemapUrl)
    
    if (response.status !== 200) {
      log.error(`Sitemap returned status ${response.status}`)
      results.issues.critical.push(`Sitemap HTTP ${response.status}`)
      return
    }
    
    // Parse URLs from sitemap
    const urlMatches = response.data.match(/<loc>([^<]+)<\/loc>/g) || []
    const urls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''))
    
    results.sitemap.urls = urls.length
    console.log(`  Found ${urls.length} URLs in sitemap`)
    
    // Check for required elements
    const hasLastmod = response.data.includes('<lastmod>')
    const hasChangefreq = response.data.includes('<changefreq>')
    const hasPriority = response.data.includes('<priority>')
    
    if (hasLastmod) log.success('Has lastmod dates')
    else log.warning('Missing lastmod dates')
    
    if (hasChangefreq) log.success('Has changefreq')
    else log.info('Missing changefreq (optional)')
    
    if (hasPriority) log.success('Has priority')
    else log.info('Missing priority (optional)')
    
    // Validate URL structure
    let validUrls = 0
    const urlIssues = []
    
    for (const url of urls) {
      // Check if URL has locale
      const hasLocale = LOCALES.some(l => url.includes(`/${l}/`) || url.endsWith(`/${l}`))
      if (!hasLocale && url !== SITE_URL) {
        urlIssues.push(`No locale: ${url}`)
      } else {
        validUrls++
      }
      
      // Check for duplicate encoded characters
      if (url.includes('%25')) {
        urlIssues.push(`Double-encoded: ${url}`)
      }
    }
    
    results.sitemap.valid = validUrls
    console.log(`  Valid URLs: ${validUrls}/${urls.length}`)
    
    if (urlIssues.length > 0 && urlIssues.length <= 10) {
      console.log(`\n  ${c.yellow}URL Issues:${c.reset}`)
      urlIssues.forEach(issue => console.log(`    ${c.dim}${issue}${c.reset}`))
    } else if (urlIssues.length > 10) {
      console.log(`\n  ${c.yellow}${urlIssues.length} URLs with issues (showing first 10):${c.reset}`)
      urlIssues.slice(0, 10).forEach(issue => console.log(`    ${c.dim}${issue}${c.reset}`))
    }
    
    // Sample URL check (check 5 random URLs)
    console.log(`\n  Checking sample URLs...`)
    const sampleUrls = urls.sort(() => Math.random() - 0.5).slice(0, 5)
    
    for (const url of sampleUrls) {
      try {
        const res = await fetchUrl(url)
        if (res.status === 200) {
          log.success(`${res.status} - ${url.substring(0, 60)}...`)
        } else if (res.status >= 300 && res.status < 400) {
          log.warning(`${res.status} Redirect - ${url.substring(0, 50)}...`)
        } else {
          log.error(`${res.status} - ${url.substring(0, 60)}...`)
          results.sitemap.errors.push({ url, status: res.status })
        }
      } catch (err) {
        log.error(`Failed: ${url.substring(0, 50)}... (${err.message})`)
        results.sitemap.errors.push({ url, error: err.message })
      }
    }
    
  } catch (error) {
    log.error(`Failed to fetch sitemap: ${error.message}`)
    results.issues.critical.push(`Sitemap fetch failed: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 3. CHECK ROBOTS.TXT
// ═══════════════════════════════════════════════════════════

async function checkRobots() {
  log.section('ROBOTS.TXT VALIDATION')
  
  try {
    const response = await fetchUrl(`${SITE_URL}/robots.txt`)
    
    if (response.status !== 200) {
      log.error(`robots.txt returned status ${response.status}`)
      return
    }
    
    const content = response.data
    
    // Check essential elements
    const hasUserAgent = content.includes('User-Agent') || content.includes('User-agent')
    const hasSitemap = content.toLowerCase().includes('sitemap')
    const hasAllow = content.includes('Allow')
    const hasDisallow = content.includes('Disallow')
    
    if (hasUserAgent) log.success('Has User-Agent directive')
    else log.error('Missing User-Agent directive')
    
    if (hasSitemap) log.success('Sitemap is referenced')
    else log.warning('Sitemap not referenced in robots.txt')
    
    if (hasAllow) log.success('Has Allow rules')
    if (hasDisallow) log.success('Has Disallow rules')
    
    // Check sitemap URL is correct
    const sitemapMatch = content.match(/Sitemap:\s*(\S+)/i)
    if (sitemapMatch) {
      const sitemapUrl = sitemapMatch[1]
      if (sitemapUrl === `${SITE_URL}/sitemap.xml`) {
        log.success(`Sitemap URL is correct`)
      } else {
        log.warning(`Sitemap URL: ${sitemapUrl}`)
      }
    }
    
  } catch (error) {
    log.error(`Failed to fetch robots.txt: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 4. CHECK CONFIG FILES
// ═══════════════════════════════════════════════════════════

function checkConfigFiles() {
  log.section('CONFIGURATION FILES')
  
  // Check config.ts
  const configPath = path.join(projectRoot, 'src', 'lib', 'config.ts')
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf-8')
    
    log.success('config.ts exists')
    
    if (config.includes('baseUrl')) log.success('Has baseUrl defined')
    else log.error('Missing baseUrl')
    
    if (config.includes('getCanonicalUrl')) log.success('Has getCanonicalUrl helper')
    else log.warning('Missing getCanonicalUrl helper')
    
    if (config.includes('getLanguageAlternates')) log.success('Has getLanguageAlternates helper')
    else log.warning('Missing getLanguageAlternates helper')
    
    if (config.includes('x-default')) log.success('Has x-default hreflang')
    else {
      log.warning('Missing x-default hreflang')
      results.issues.warning.push('config.ts: Missing x-default hreflang')
    }
  } else {
    log.error('config.ts not found')
  }
  
  // Check middleware.ts
  const middlewarePath = path.join(projectRoot, 'middleware.ts')
  if (fs.existsSync(middlewarePath)) {
    const middleware = fs.readFileSync(middlewarePath, 'utf-8')
    log.success('middleware.ts exists')
    
    if (middleware.includes('redirect') || middleware.includes('rewrite')) {
      log.success('Has redirect/rewrite logic')
    }
  } else {
    log.info('No middleware.ts (optional)')
  }
  
  // Check next.config.ts
  const nextConfigPath = path.join(projectRoot, 'next.config.ts')
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8')
    log.success('next.config.ts exists')
    
    if (nextConfig.includes('redirects')) log.success('Has redirects configured')
    if (nextConfig.includes('headers')) log.success('Has custom headers')
  }
}

// ═══════════════════════════════════════════════════════════
// 5. CHECK LIVE PAGES
// ═══════════════════════════════════════════════════════════

async function checkLivePages() {
  log.section('LIVE PAGE ANALYSIS')
  
  const testUrls = [
    `${SITE_URL}/ka`,
    `${SITE_URL}/en`,
    `${SITE_URL}/ka/practices`,
    `${SITE_URL}/ka/specialists`,
    `${SITE_URL}/ka/companies`,
    `${SITE_URL}/ka/news`,
  ]
  
  for (const url of testUrls) {
    try {
      const response = await fetchUrl(url)
      const html = response.data
      
      // Check canonical
      const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)
      const hasCanonical = !!canonicalMatch
      
      // Check hreflang
      const hreflangMatches = html.match(/<link[^>]*hrefLang="[^"]+"/g) || []
      const hasAllHreflang = hreflangMatches.length >= 3 // ka, en, ru
      
      // Check OG tags
      const hasOgTitle = html.includes('og:title')
      const hasOgDesc = html.includes('og:description')
      const hasOgImage = html.includes('og:image')
      
      // Check title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      const hasTitle = !!titleMatch && titleMatch[1].length > 10
      
      // Check meta description
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
      const hasDesc = !!descMatch && descMatch[1].length > 50
      
      const shortUrl = url.replace(SITE_URL, '')
      const status = []
      
      if (response.status === 200) status.push(`${c.green}200${c.reset}`)
      else status.push(`${c.red}${response.status}${c.reset}`)
      
      if (hasCanonical) status.push(`${c.green}canonical${c.reset}`)
      else status.push(`${c.red}no-canonical${c.reset}`)
      
      if (hasAllHreflang) status.push(`${c.green}hreflang(${hreflangMatches.length})${c.reset}`)
      else status.push(`${c.yellow}hreflang(${hreflangMatches.length})${c.reset}`)
      
      if (hasOgTitle && hasOgImage) status.push(`${c.green}OG${c.reset}`)
      else status.push(`${c.yellow}OG-partial${c.reset}`)
      
      console.log(`  ${shortUrl || '/'} → ${status.join(' | ')}`)
      
    } catch (error) {
      console.log(`  ${c.red}✗${c.reset} ${url} - ${error.message}`)
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 6. TYPESCRIPT/SYNTAX CHECK
// ═══════════════════════════════════════════════════════════

async function checkTypeScript() {
  log.section('TYPESCRIPT VALIDATION')
  
  const { execSync } = await import('child_process')
  
  try {
    console.log('  Running TypeScript compiler check...')
    execSync('npx tsc --noEmit', { cwd: projectRoot, stdio: 'pipe' })
    log.success('No TypeScript errors found')
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || ''
    const errorCount = (output.match(/error TS/g) || []).length
    
    if (errorCount > 0) {
      log.error(`Found ${errorCount} TypeScript errors`)
      results.issues.critical.push(`${errorCount} TypeScript errors`)
      
      // Show first few errors
      const lines = output.split('\n').filter(l => l.includes('error TS')).slice(0, 5)
      lines.forEach(line => console.log(`    ${c.dim}${line.substring(0, 100)}${c.reset}`))
    } else {
      log.success('TypeScript check passed')
    }
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════

async function generateReport() {
  log.header('')
  console.log(`${c.bold}${c.cyan}`)
  console.log(`  ╔══════════════════════════════════════════════════════════╗`)
  console.log(`  ║        🔍 COMPREHENSIVE SEO & CODE AUDIT                 ║`)
  console.log(`  ║              legal.ge - ${new Date().toLocaleDateString()}                    ║`)
  console.log(`  ╚══════════════════════════════════════════════════════════╝`)
  console.log(`${c.reset}`)
  
  await analyzeAllPages()
  await validateSitemap()
  await checkRobots()
  checkConfigFiles()
  await checkLivePages()
  await checkTypeScript()
  
  // Final Summary
  log.header('')
  console.log(`${c.bold}  📊 FINAL SUMMARY${c.reset}`)
  console.log(`  ─────────────────────────────────────`)
  
  const criticalCount = results.issues.critical.length
  const warningCount = results.issues.warning.length
  
  console.log(`  Pages analyzed: ${results.pages.total}`)
  console.log(`  Sitemap URLs: ${results.sitemap.urls}`)
  console.log(`  ${c.red}Critical issues: ${criticalCount}${c.reset}`)
  console.log(`  ${c.yellow}Warnings: ${warningCount}${c.reset}`)
  
  // Score
  const score = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 5))
  let scoreColor = score >= 80 ? c.green : score >= 60 ? c.yellow : c.red
  
  console.log(`\n  ${c.bold}SEO SCORE: ${scoreColor}${score}/100${c.reset}`)
  
  if (criticalCount > 0) {
    console.log(`\n  ${c.red}${c.bold}CRITICAL ISSUES TO FIX:${c.reset}`)
    results.issues.critical.forEach((issue, i) => {
      console.log(`    ${i + 1}. ${issue}`)
    })
  }
  
  if (warningCount > 0 && warningCount <= 10) {
    console.log(`\n  ${c.yellow}${c.bold}WARNINGS:${c.reset}`)
    results.issues.warning.forEach((issue, i) => {
      console.log(`    ${i + 1}. ${issue}`)
    })
  }
  
  console.log(`\n${c.dim}  Audit completed at ${new Date().toLocaleTimeString()}${c.reset}\n`)
}

// Run
generateReport().catch(console.error)
