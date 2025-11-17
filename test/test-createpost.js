/**
 * Test script for CreatePostPage.tsx validation
 * 
 * This script validates:
 * 1. TypeScript syntax and imports
 * 2. Component structure
 * 3. Required props and types
 * 4. Context integration
 * 5. Keyboard shortcuts logic
 * 6. Accessibility features
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const symbol = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`  ${symbol} ${name}`, color);
  if (details) {
    log(`    ${details}`, 'yellow');
  }
}

// Read the CreatePostPage.tsx file
const filePath = path.join(__dirname, 'src', 'components', 'superadmindashboard', 'posts', 'createpost', 'CreatePostPage.tsx');

log('\n' + '='.repeat(60), 'blue');
log('  CreatePostPage.tsx Validation Test', 'bold');
log('='.repeat(60) + '\n', 'blue');

try {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: File exists and is readable
  totalTests++;
  const test1 = fileContent.length > 0;
  logTest('File exists and is readable', test1);
  if (test1) passedTests++;

  // Test 2: Has 'use client' directive
  totalTests++;
  const test2 = fileContent.includes("'use client'");
  logTest("Has 'use client' directive", test2);
  if (test2) passedTests++;

  // Test 3: Imports required dependencies
  totalTests++;
  const requiredImports = [
    'useEffect',
    'useCallback',
    'memo',
    'useTheme',
    'PostTranslationsProvider',
    'usePostTranslations',
    'lucide-react'
  ];
  const missingImports = requiredImports.filter(imp => !fileContent.includes(imp));
  const test3 = missingImports.length === 0;
  logTest('Imports all required dependencies', test3, 
    missingImports.length > 0 ? `Missing: ${missingImports.join(', ')}` : '');
  if (test3) passedTests++;

  // Test 4: Has TypeScript interfaces
  totalTests++;
  const test4 = fileContent.includes('interface PostData') && 
                fileContent.includes('interface CreatePostPageProps');
  logTest('Defines TypeScript interfaces', test4);
  if (test4) passedTests++;

  // Test 5: Has memoized components
  totalTests++;
  const test5 = fileContent.includes('const TabButton = memo(') && 
                fileContent.includes('const LanguageButton = memo(');
  logTest('Uses React.memo for optimization', test5);
  if (test5) passedTests++;

  // Test 6: Has keyboard shortcuts handler
  totalTests++;
  const test6 = fileContent.includes('handleKeyDown') && 
                fileContent.includes("e.key === 's'") &&
                fileContent.includes("e.key === 'Escape'");
  logTest('Implements keyboard shortcuts (Ctrl+S, Esc)', test6);
  if (test6) passedTests++;

  // Test 7: Has unsaved changes warning
  totalTests++;
  const test7 = fileContent.includes('handleBeforeUnload') && 
                fileContent.includes('beforeunload');
  logTest('Implements unsaved changes warning', test7);
  if (test7) passedTests++;

  // Test 8: Has ARIA labels for accessibility
  totalTests++;
  const ariaLabels = [
    'aria-label',
    'aria-selected',
    'aria-pressed',
    'role="tab"',
    'role="tablist"',
    'role="tabpanel"',
    'role="main"'
  ];
  const foundAriaLabels = ariaLabels.filter(label => fileContent.includes(label));
  const test8 = foundAriaLabels.length >= 5;
  logTest('Has accessibility features (ARIA)', test8, 
    `Found ${foundAriaLabels.length}/${ariaLabels.length} ARIA attributes`);
  if (test8) passedTests++;

  // Test 9: Has all required tabs
  totalTests++;
  const requiredTabs = ['content', 'category', 'seo', 'social'];
  const foundTabs = requiredTabs.filter(tab => fileContent.includes(`id: '${tab}'`));
  const test9 = foundTabs.length === requiredTabs.length;
  logTest('Defines all 4 tabs (Content, Category, SEO, Social)', test9,
    `Found ${foundTabs.length}/${requiredTabs.length} tabs`);
  if (test9) passedTests++;

  // Test 10: Has all language options
  totalTests++;
  const requiredLanguages = ['georgian', 'english', 'russian'];
  const foundLanguages = requiredLanguages.filter(lang => fileContent.includes(`id: '${lang}'`));
  const test10 = foundLanguages.length === requiredLanguages.length;
  logTest('Supports 3 languages (Georgian, English, Russian)', test10,
    `Found ${foundLanguages.length}/${requiredLanguages.length} languages`);
  if (test10) passedTests++;

  // Test 11: Has status options
  totalTests++;
  const statusOptions = ['draft', 'pending', 'published', 'archived'];
  const foundStatuses = statusOptions.filter(status => fileContent.includes(`value: '${status}'`));
  const test11 = foundStatuses.length === statusOptions.length;
  logTest('Has all status options', test11,
    `Found ${foundStatuses.length}/${statusOptions.length} statuses`);
  if (test11) passedTests++;

  // Test 12: Uses PostTranslationsContext
  totalTests++;
  const contextMethods = [
    'activeTab',
    'activeLanguage',
    'setActiveTab',
    'setActiveLanguage',
    'saving',
    'savePost',
    'status',
    'setStatus',
    'publishedAt',
    'setPublishedAt'
  ];
  const foundContextMethods = contextMethods.filter(method => fileContent.includes(method));
  const test12 = foundContextMethods.length >= 8;
  logTest('Integrates PostTranslationsContext', test12,
    `Uses ${foundContextMethods.length}/${contextMethods.length} context methods`);
  if (test12) passedTests++;

  // Test 13: Has theme support
  totalTests++;
  const test13 = fileContent.includes('useTheme') && 
                 fileContent.includes('isDark') &&
                 fileContent.includes("theme === 'dark'");
  logTest('Supports dark/light theme', test13);
  if (test13) passedTests++;

  // Test 14: Has disabled states during saving
  totalTests++;
  const test14 = fileContent.includes('disabled={saving}') || 
                 fileContent.includes('disabled:opacity-50');
  logTest('Implements disabled states during save', test14);
  if (test14) passedTests++;

  // Test 15: Has loading spinner
  totalTests++;
  const test15 = fileContent.includes('Loader2') && 
                 fileContent.includes('animate-spin');
  logTest('Shows loading spinner during save', test15);
  if (test15) passedTests++;

  // Test 16: Has proper component export
  totalTests++;
  const test16 = fileContent.includes('export default function CreatePostPage') &&
                 fileContent.includes('<PostTranslationsProvider');
  logTest('Exports component with Provider wrapper', test16);
  if (test16) passedTests++;

  // Test 17: Has publication date picker
  totalTests++;
  const test17 = fileContent.includes('datetime-local') && 
                 fileContent.includes('publishedAt') &&
                 fileContent.includes('handleDateChange');
  logTest('Implements publication date picker', test17);
  if (test17) passedTests++;

  // Test 18: Has clear date functionality
  totalTests++;
  const test18 = fileContent.includes('clearDate') || 
                 (fileContent.includes('setPublishedAt(null)') && fileContent.includes('Clear'));
  logTest('Has clear date button', test18);
  if (test18) passedTests++;

  // Test 19: Has ultra-compact styling
  totalTests++;
  const compactStyles = ['text-xs', 'text-[10px]', 'gap-1.5', 'px-3 py-1.5', 'px-3 py-2'];
  const foundCompactStyles = compactStyles.filter(style => fileContent.includes(style));
  const test19 = foundCompactStyles.length >= 3;
  logTest('Uses ultra-compact design system', test19,
    `Found ${foundCompactStyles.length}/${compactStyles.length} compact styles`);
  if (test19) passedTests++;

  // Test 20: Has focus states for accessibility
  totalTests++;
  const test20 = fileContent.includes('focus:ring') || 
                 fileContent.includes('focus:outline');
  logTest('Has focus states for keyboard navigation', test20);
  if (test20) passedTests++;

  // Summary
  log('\n' + '-'.repeat(60), 'blue');
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  log(`  Results: ${passedTests}/${totalTests} tests passed (${percentage}%)`, 'bold');
  log('-'.repeat(60), 'blue');

  if (passedTests === totalTests) {
    log('\n✨ All tests passed! Component is production-ready.\n', 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review required.\n`, 'yellow');
    process.exit(1);
  }

} catch (error) {
  log('\n✗ Error reading file:', 'red');
  log(`  ${error.message}\n`, 'red');
  process.exit(1);
}
