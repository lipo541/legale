// Check canonical tags on all pages
const pages = [
  { url: 'https://legal.ge/', expected: 'https://legal.ge/ka', name: 'Root' },
  { url: 'https://legal.ge/ka', expected: 'https://legal.ge/ka', name: '/ka' },
  { url: 'https://legal.ge/en', expected: 'https://legal.ge/en', name: '/en' },
  { url: 'https://legal.ge/ru', expected: 'https://legal.ge/ru', name: '/ru' },
  { url: 'https://legal.ge/ka/specialists', expected: 'https://legal.ge/ka/specialists', name: '/ka/specialists' },
  { url: 'https://legal.ge/en/specialists', expected: 'https://legal.ge/en/specialists', name: '/en/specialists' },
  { url: 'https://legal.ge/ka/companies', expected: 'https://legal.ge/ka/companies', name: '/ka/companies' },
  { url: 'https://legal.ge/ka/practices', expected: 'https://legal.ge/ka/practices', name: '/ka/practices' },
  { url: 'https://legal.ge/ka/news', expected: 'https://legal.ge/ka/news', name: '/ka/news' },
  { url: 'https://legal.ge/ka/contact', expected: 'https://legal.ge/ka/contact', name: '/ka/contact' },
];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           CANONICAL TAG CONSISTENCY CHECK                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let issues = 0;

for (const page of pages) {
  try {
    const response = await fetch(page.url, { redirect: 'follow' });
    const html = await response.text();
    
    // Extract canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                          html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : 'NOT FOUND';
    
    // Extract hreflang count
    const hreflangs = html.match(/hreflang=/g) || [];
    
    // Check if canonical matches expected
    if (canonical === page.expected) {
      console.log(`✓ ${page.name}`);
      console.log(`  canonical: ${canonical}`);
      console.log(`  hreflangs: ${hreflangs.length}`);
    } else {
      console.log(`✗ ${page.name}`);
      console.log(`  declared:  ${canonical}`);
      console.log(`  expected:  ${page.expected}`);
      issues++;
    }
    console.log('');
  } catch (error) {
    console.log(`✗ ${page.name} - Error: ${error.message}`);
    issues++;
  }
}

// Check redirect pages (should 307/308 redirect)
console.log('─────────────────────────────────────────────────────────────');
console.log('REDIRECT PAGES (non-locale paths):\n');

const redirectPages = ['/specialists', '/companies', '/practices', '/news', '/contact'];

for (const path of redirectPages) {
  try {
    const response = await fetch(`https://legal.ge${path}`, { redirect: 'manual' });
    const status = response.status;
    const location = response.headers.get('location');
    
    if (status === 307 || status === 308) {
      console.log(`✓ ${path} → ${status} redirect to ${location}`);
    } else {
      console.log(`⚠ ${path} → ${status} (expected 307/308)`);
      issues++;
    }
  } catch (error) {
    console.log(`✗ ${path} - Error`);
  }
}

console.log('\n═════════════════════════════════════════════════════════════');
console.log(`SUMMARY: ${issues === 0 ? '✓ No issues found!' : `⚠ ${issues} issue(s) found`}`);
