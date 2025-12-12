#!/usr/bin/env node
/**
 * SEO Audit Script for Next.js Project
 * Scans all page files and checks for SEO issues
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const appDir = path.join(projectRoot, 'src', 'app')

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`)
}

// SEO Issues tracker
const issues = {
  critical: [],
  warning: [],
  info: []
}

// Find all page.tsx files
function findPageFiles(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden folders
      if (!item.startsWith('.') && item !== 'node_modules') {
        findPageFiles(fullPath, files)
      }
    } else if (item === 'page.tsx') {
      files.push(fullPath)
    }
  }
  
  return files
}

// Analyze a page file for SEO issues
function analyzePageFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(projectRoot, filePath)
  const pageName = relativePath.replace('src/app/', '').replace('/page.tsx', '') || 'root'
  
  const pageIssues = []
  
  // Check 1: Has generateMetadata or metadata export
  const hasGenerateMetadata = content.includes('export async function generateMetadata') || 
                               content.includes('export function generateMetadata')
  const hasMetadataExport = content.includes('export const metadata')
  
  if (!hasGenerateMetadata && !hasMetadataExport) {
    pageIssues.push({
      level: 'critical',
      message: `No metadata export found`,
      fix: 'Add generateMetadata function or metadata export'
    })
  }
  
  // Check 2: Has canonical URL in metadata
  if (hasGenerateMetadata || hasMetadataExport) {
    const hasCanonical = content.includes('canonical')
    if (!hasCanonical) {
      pageIssues.push({
        level: 'warning',
        message: `Missing canonical URL in metadata`,
        fix: 'Add alternates.canonical to metadata'
      })
    }
    
    // Check 3: Has language alternates
    const hasAlternates = content.includes('alternates') && 
                          (content.includes('languages') || content.includes('hrefLang'))
    if (!hasAlternates) {
      pageIssues.push({
        level: 'warning',
        message: `Missing language alternates (hreflang)`,
        fix: 'Add alternates.languages to metadata'
      })
    }
    
    // Check 4: Has OpenGraph metadata
    const hasOpenGraph = content.includes('openGraph')
    if (!hasOpenGraph) {
      pageIssues.push({
        level: 'warning',
        message: `Missing OpenGraph metadata`,
        fix: 'Add openGraph object to metadata'
      })
    }
    
    // Check 5: Has Twitter metadata
    const hasTwitter = content.includes('twitter')
    if (!hasTwitter) {
      pageIssues.push({
        level: 'info',
        message: `Missing Twitter card metadata`,
        fix: 'Add twitter object to metadata'
      })
    }
  }
  
  // Check 6: Dynamic pages should have generateStaticParams
  const isDynamicPage = relativePath.includes('[')
  const hasGenerateStaticParams = content.includes('generateStaticParams')
  
  if (isDynamicPage && !hasGenerateStaticParams) {
    // Check if it's a catch-all route (these might not need static params)
    if (!relativePath.includes('[...')) {
      pageIssues.push({
        level: 'info',
        message: `Dynamic page without generateStaticParams`,
        fix: 'Consider adding generateStaticParams for better SEO'
      })
    }
  }
  
  return { pageName, relativePath, issues: pageIssues }
}

// Check config.ts for SEO settings
function checkConfig() {
  const configPath = path.join(projectRoot, 'src', 'lib', 'config.ts')
  
  if (!fs.existsSync(configPath)) {
    issues.critical.push({
      file: 'src/lib/config.ts',
      message: 'Config file not found',
      fix: 'Create config.ts with siteConfig export'
    })
    return
  }
  
  const content = fs.readFileSync(configPath, 'utf-8')
  
  // Check baseUrl
  if (!content.includes('baseUrl')) {
    issues.critical.push({
      file: 'src/lib/config.ts',
      message: 'Missing baseUrl in config',
      fix: 'Add baseUrl to siteConfig'
    })
  }
  
  // Check for www in baseUrl
  if (content.includes('www.legal.ge') && !content.includes('legal.ge')) {
    issues.warning.push({
      file: 'src/lib/config.ts',
      message: 'BaseUrl uses www - ensure proper redirect is set up',
      fix: 'Decide on canonical domain (with or without www)'
    })
  }
  
  // Check getCanonicalUrl function
  if (!content.includes('getCanonicalUrl')) {
    issues.warning.push({
      file: 'src/lib/config.ts',
      message: 'Missing getCanonicalUrl helper function',
      fix: 'Add getCanonicalUrl function for consistent canonical URLs'
    })
  }
  
  // Check getLanguageAlternates function
  if (!content.includes('getLanguageAlternates')) {
    issues.warning.push({
      file: 'src/lib/config.ts',
      message: 'Missing getLanguageAlternates helper function',
      fix: 'Add getLanguageAlternates for hreflang consistency'
    })
  }
}

// Check sitemap.ts
function checkSitemap() {
  const sitemapPath = path.join(projectRoot, 'src', 'app', 'sitemap.ts')
  
  if (!fs.existsSync(sitemapPath)) {
    issues.critical.push({
      file: 'src/app/sitemap.ts',
      message: 'Sitemap file not found',
      fix: 'Create sitemap.ts with MetadataRoute.Sitemap export'
    })
    return
  }
  
  const content = fs.readFileSync(sitemapPath, 'utf-8')
  
  // Check for proper exports
  if (!content.includes('MetadataRoute.Sitemap')) {
    issues.warning.push({
      file: 'src/app/sitemap.ts',
      message: 'Not using Next.js MetadataRoute.Sitemap type',
      fix: 'Use proper Next.js sitemap type'
    })
  }
  
  // Check for lastModified
  if (!content.includes('lastModified')) {
    issues.warning.push({
      file: 'src/app/sitemap.ts',
      message: 'Missing lastModified dates in sitemap',
      fix: 'Add lastModified to sitemap entries'
    })
  }
  
  // Check for changeFrequency
  if (!content.includes('changeFrequency')) {
    issues.info.push({
      file: 'src/app/sitemap.ts',
      message: 'Missing changeFrequency in sitemap',
      fix: 'Add changeFrequency for better crawl hints'
    })
  }
  
  // Check for priority
  if (!content.includes('priority')) {
    issues.info.push({
      file: 'src/app/sitemap.ts',
      message: 'Missing priority in sitemap',
      fix: 'Add priority to indicate page importance'
    })
  }
}

// Check robots.ts
function checkRobots() {
  const robotsPath = path.join(projectRoot, 'src', 'app', 'robots.ts')
  
  if (!fs.existsSync(robotsPath)) {
    issues.critical.push({
      file: 'src/app/robots.ts',
      message: 'Robots file not found',
      fix: 'Create robots.ts with MetadataRoute.Robots export'
    })
    return
  }
  
  const content = fs.readFileSync(robotsPath, 'utf-8')
  
  // Check for sitemap reference
  if (!content.includes('sitemap')) {
    issues.warning.push({
      file: 'src/app/robots.ts',
      message: 'Sitemap not referenced in robots.txt',
      fix: 'Add sitemap URL to robots.ts'
    })
  }
  
  // Check for proper disallow rules
  if (!content.includes('disallow') && !content.includes('Disallow')) {
    issues.info.push({
      file: 'src/app/robots.ts',
      message: 'No disallow rules in robots.txt',
      fix: 'Consider adding disallow rules for admin/private pages'
    })
  }
}

// Check layout.tsx for global SEO settings
function checkLayout() {
  const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx')
  
  if (!fs.existsSync(layoutPath)) {
    issues.critical.push({
      file: 'src/app/layout.tsx',
      message: 'Root layout not found',
      fix: 'Create root layout.tsx'
    })
    return
  }
  
  const content = fs.readFileSync(layoutPath, 'utf-8')
  
  // Check for metadataBase
  if (!content.includes('metadataBase')) {
    issues.critical.push({
      file: 'src/app/layout.tsx',
      message: 'Missing metadataBase in root layout',
      fix: 'Add metadataBase to metadata export for proper URL resolution'
    })
  }
  
  // Check for viewport
  if (!content.includes('viewport')) {
    issues.warning.push({
      file: 'src/app/layout.tsx',
      message: 'Missing viewport configuration',
      fix: 'Add viewport export for mobile optimization'
    })
  }
  
  // Check for lang attribute
  if (!content.includes('lang=')) {
    issues.warning.push({
      file: 'src/app/layout.tsx',
      message: 'Missing lang attribute on html element',
      fix: 'Add lang attribute to <html> tag'
    })
  }
}

// Check middleware for redirects
function checkMiddleware() {
  const middlewarePath = path.join(projectRoot, 'middleware.ts')
  
  if (!fs.existsSync(middlewarePath)) {
    issues.info.push({
      file: 'middleware.ts',
      message: 'No middleware.ts found',
      fix: 'Consider adding middleware for locale detection and redirects'
    })
    return
  }
  
  const content = fs.readFileSync(middlewarePath, 'utf-8')
  
  // Check for www redirect
  if (!content.includes('www')) {
    issues.info.push({
      file: 'middleware.ts',
      message: 'No www redirect in middleware',
      fix: 'Consider adding www to non-www redirect'
    })
  }
}

// Check for x-default hreflang
function checkXDefault() {
  const configPath = path.join(projectRoot, 'src', 'lib', 'config.ts')
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8')
    
    if (!content.includes('x-default')) {
      issues.warning.push({
        file: 'src/lib/config.ts',
        message: 'Missing x-default hreflang',
        fix: 'Add x-default to language alternates for default language fallback'
      })
    }
  }
}

// Main audit function
async function runAudit() {
  console.log(`\n${colors.bold}${colors.cyan}`)
  console.log('╔════════════════════════════════════════════╗')
  console.log('║     🔍 SEO AUDIT - Next.js Project         ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  // 1. Check global config files
  log.header('Checking Global SEO Configuration')
  checkConfig()
  checkSitemap()
  checkRobots()
  checkLayout()
  checkMiddleware()
  checkXDefault()
  
  // 2. Analyze all page files
  log.header('Analyzing Page Files')
  const pageFiles = findPageFiles(appDir)
  console.log(`Found ${pageFiles.length} page files\n`)
  
  let pagesWithIssues = 0
  
  for (const file of pageFiles) {
    const result = analyzePageFile(file)
    
    if (result.issues.length > 0) {
      pagesWithIssues++
      console.log(`${colors.yellow}📄 ${result.pageName}${colors.reset}`)
      
      for (const issue of result.issues) {
        if (issue.level === 'critical') {
          issues.critical.push({ file: result.relativePath, ...issue })
          log.error(issue.message)
        } else if (issue.level === 'warning') {
          issues.warning.push({ file: result.relativePath, ...issue })
          log.warning(issue.message)
        } else {
          issues.info.push({ file: result.relativePath, ...issue })
          log.info(issue.message)
        }
      }
      console.log('')
    }
  }
  
  // 3. Summary
  log.header('AUDIT SUMMARY')
  
  const totalIssues = issues.critical.length + issues.warning.length + issues.info.length
  
  console.log(`📊 Total pages analyzed: ${pageFiles.length}`)
  console.log(`📊 Pages with issues: ${pagesWithIssues}`)
  console.log('')
  
  if (issues.critical.length > 0) {
    console.log(`${colors.red}🔴 Critical Issues: ${issues.critical.length}${colors.reset}`)
  }
  if (issues.warning.length > 0) {
    console.log(`${colors.yellow}🟡 Warnings: ${issues.warning.length}${colors.reset}`)
  }
  if (issues.info.length > 0) {
    console.log(`${colors.cyan}🔵 Info/Suggestions: ${issues.info.length}${colors.reset}`)
  }
  
  if (totalIssues === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 No SEO issues found! Your project looks great!${colors.reset}`)
  } else {
    // Detailed report
    if (issues.critical.length > 0) {
      log.header('CRITICAL ISSUES (Must Fix)')
      issues.critical.forEach((issue, i) => {
        console.log(`${i + 1}. ${colors.red}${issue.file}${colors.reset}`)
        console.log(`   Problem: ${issue.message}`)
        console.log(`   Fix: ${issue.fix}\n`)
      })
    }
    
    if (issues.warning.length > 0) {
      log.header('WARNINGS (Should Fix)')
      issues.warning.forEach((issue, i) => {
        console.log(`${i + 1}. ${colors.yellow}${issue.file}${colors.reset}`)
        console.log(`   Problem: ${issue.message}`)
        console.log(`   Fix: ${issue.fix}\n`)
      })
    }
  }
  
  // Score calculation
  const score = Math.max(0, 100 - (issues.critical.length * 10) - (issues.warning.length * 3) - (issues.info.length * 1))
  
  log.header('SEO SCORE')
  let scoreColor = colors.green
  if (score < 70) scoreColor = colors.red
  else if (score < 85) scoreColor = colors.yellow
  
  console.log(`${scoreColor}${colors.bold}`)
  console.log(`   ╔═══════════════╗`)
  console.log(`   ║   ${score}/100     ║`)
  console.log(`   ╚═══════════════╝`)
  console.log(colors.reset)
  
  if (score >= 90) {
    console.log('🏆 Excellent! Your SEO setup is top-notch.')
  } else if (score >= 70) {
    console.log('👍 Good! Fix the warnings to improve further.')
  } else {
    console.log('⚠️  Needs work. Focus on critical issues first.')
  }
  
  console.log('')
}

// Run the audit
runAudit().catch(console.error)
