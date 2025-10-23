# SEO სტრატეგია და ოპტიმიზაცია

## 🎯 მიმოხილვა

`legalge` პროექტი იყენებს Next.js 15-ის ყველა თანამედროვე SEO შესაძლებლობას მაქსიმალური საძიებო ხილვადობისთვის.

---

## 1. 📄 დინამიური Metadata (`generateMetadata`)

### იმპლემენტაცია

თითოეულ გვერდს აქვს უნიკალური SEO თეგები:

```typescript
// app/[locale]/news/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);
  
  if (!post) return {};
  
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || stripHtml(post.excerpt || post.body).slice(0, 160),
    keywords: post.metaKeywords,
    
    // Open Graph (Facebook, LinkedIn)
    openGraph: {
      title: post.ogTitle || post.title,
      description: post.ogDescription || post.metaDescription,
      url: `${SITE_ORIGIN}/${locale}/news/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
      images: [
        {
          url: post.coverImage || '/default-og-image.jpg',
          width: 1200,
          height: 630,
          alt: post.coverImageAlt || post.title
        }
      ],
      locale: locale,
      siteName: 'Legal Sandbox Georgia'
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.title,
      description: post.ogDescription || post.metaDescription,
      images: [post.coverImage || '/default-og-image.jpg']
    },
    
    // Canonical URL
    alternates: {
      canonical: `${SITE_ORIGIN}/${locale}/news/${post.slug}`,
      languages: {
        'ka': `${SITE_ORIGIN}/ka/news/${post.slug}`,
        'en': `${SITE_ORIGIN}/en/news/${post.slug}`,
        'ru': `${SITE_ORIGIN}/ru/news/${post.slug}`
      }
    }
  };
}
```

### გამოყენებული გვერდები:
- ✅ Homepage (`/[locale]`)
- ✅ Practice Areas (`/[locale]/practice/[slug]`)
- ✅ Services (`/[locale]/services/[slug]`)
- ✅ News Posts (`/[locale]/news/[slug]`)
- ✅ Specialists (`/[locale]/specialists/[slug]`)
- ✅ Companies (`/[locale]/companies/[slug]`)

---

## 2. 🗺️ დინამიური Sitemap (`sitemap.ts`)

### იმპლემენტაცია

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge';
  
  // Static pages
  const staticPages = [
    { url: `${baseUrl}`, lastModified: new Date() },
    { url: `${baseUrl}/ka`, lastModified: new Date() },
    { url: `${baseUrl}/en`, lastModified: new Date() },
    { url: `${baseUrl}/ru`, lastModified: new Date() },
  ];
  
  // Practice areas (all locales)
  const practiceAreas = await prisma.practiceArea.findMany({
    include: { translations: true }
  });
  
  const practiceUrls = practiceAreas.flatMap(practice => 
    practice.translations.map(t => ({
      url: `${baseUrl}/${t.locale}/practice/${t.slug}`,
      lastModified: practice.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8
    }))
  );
  
  // Services
  const services = await prisma.service.findMany({
    include: { translations: true }
  });
  
  const serviceUrls = services.flatMap(service =>
    service.translations.map(t => ({
      url: `${baseUrl}/${t.locale}/services/${t.slug}`,
      lastModified: service.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }))
  );
  
  // Blog posts
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    include: { translations: true }
  });
  
  const postUrls = posts.flatMap(post =>
    post.translations.map(t => ({
      url: `${baseUrl}/${t.locale}/news/${t.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6
    }))
  );
  
  // Specialists
  const specialists = await prisma.specialistProfile.findMany({
    where: { isActive: true }
  });
  
  const specialistUrls = specialists.flatMap(specialist => [
    {
      url: `${baseUrl}/ka/specialists/${specialist.slug}`,
      lastModified: specialist.updatedAt,
      priority: 0.7
    },
    {
      url: `${baseUrl}/en/specialists/${specialist.slug}`,
      lastModified: specialist.updatedAt,
      priority: 0.7
    },
    {
      url: `${baseUrl}/ru/specialists/${specialist.slug}`,
      lastModified: specialist.updatedAt,
      priority: 0.7
    }
  ]);
  
  return [
    ...staticPages,
    ...practiceUrls,
    ...serviceUrls,
    ...postUrls,
    ...specialistUrls
  ];
}
```

### რას აკეთებს:
- ✅ ავტომატურად აგენერირებს XML sitemap-ს
- ✅ მოიცავს ყველა დინამიურ გვერდს
- ✅ განახლების თარიღებს ითვალისწინებს
- ✅ Priority და changeFrequency-ს განსაზღვრავს
- ✅ მრავალენოვან URL-ებს აგენერირებს

---

## 3. 🤖 Robots.txt (`robots.ts`)

### იმპლემენტაცია

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/company/',
          '/specialist/',
          '/api/',
          '/_next/',
          '/auth/signin',
          '/auth/register'
        ]
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/company/', '/specialist/']
      }
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
  };
}
```

### რას უზრუნველყოფს:
- ✅ საჯარო გვერდების ინდექსაცია
- ❌ Admin პანელის დაბლოკვა
- ❌ API routes-ის დაბლოკვა
- ❌ Auth გვერდების დაბლოკვა
- ✅ Sitemap-ის მისამართი

---

## 4. 📊 სტრუქტურირებული მონაცემები (JSON-LD)

### Article Schema (სტატიები)

```typescript
// lib/structuredData.ts
export function buildArticleLd(post: Post, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.coverImage ? `${SITE_ORIGIN}${post.coverImage}` : undefined,
    "datePublished": post.publishedAt?.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "url": post.author.authorSlug 
        ? `${SITE_ORIGIN}/${locale}/authors/${post.author.authorSlug}`
        : undefined
    },
    "publisher": {
      "@type": "Organization",
      "name": "Legal Sandbox Georgia",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_ORIGIN}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/${locale}/news/${post.slug}`
    }
  };
}
```

### BreadcrumbList Schema

```typescript
export function buildBreadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
```

### Service Schema

```typescript
export function buildServiceLd(service: Service, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": "Legal Sandbox Georgia"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Georgia"
    },
    "url": `${SITE_ORIGIN}/${locale}/services/${service.slug}`
  };
}
```

### Organization Schema

```typescript
export function buildOrganizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Legal Sandbox Georgia",
    "url": "https://legal.ge",
    "logo": "https://legal.ge/logo.png",
    "description": "Comprehensive legal services platform in Georgia",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE"
    },
    "sameAs": [
      "https://www.facebook.com/legalge",
      "https://www.linkedin.com/company/legalge"
    ]
  };
}
```

### გამოყენება გვერდზე:

```typescript
// app/[locale]/news/[slug]/page.tsx
export default async function PostPage({ params }) {
  const post = await getPost(params.slug, params.locale);
  const articleLd = buildArticleLd(post, params.locale);
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', url: `${SITE_ORIGIN}/${params.locale}` },
    { name: 'News', url: `${SITE_ORIGIN}/${params.locale}/news` },
    { name: post.title, url: `${SITE_ORIGIN}/${params.locale}/news/${post.slug}` }
  ]);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 5. 🔤 სემანტიკური HTML

### სწორი სტრუქტურა:

```tsx
<main>
  <article>
    <header>
      <h1>{post.title}</h1>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
    </header>
    
    <section>
      <RichText content={post.body} />
    </section>
    
    <footer>
      <address>
        By <a href={authorUrl}>{post.author.name}</a>
      </address>
    </footer>
  </article>
  
  <aside>
    <nav aria-label="Related posts">
      {/* Related content */}
    </nav>
  </aside>
</main>
```

### სათაურების იერარქია:
```html
<h1>Page Title</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
      <h4>Detail</h4>
```

---

## 6. 🖼️ სურათების ოპტიმიზაცია

### Next.js Image Component:

```tsx
import Image from 'next/image';

<Image
  src={post.coverImage}
  alt={post.coverImageAlt || post.title}
  width={1200}
  height={630}
  priority={true} // for above-the-fold images
  quality={85}
  loading="lazy" // for below-the-fold
/>
```

### რას უზრუნველყოფს:
- ✅ ავტომატური WebP/AVIF გარდაქმნა
- ✅ Responsive images
- ✅ Lazy loading
- ✅ Alt text-ები SEO-სთვის

---

## 7. 🌍 Hreflang Tags (მრავალენოვანი SEO)

### იმპლემენტაცია:

```typescript
// lib/metadata.ts
export function createLocaleRouteMetadata(
  locale: Locale,
  slug: string,
  pathMap: LocalePathMap
): Metadata {
  return {
    alternates: {
      canonical: `${SITE_ORIGIN}/${locale}${pathMap[locale]}`,
      languages: {
        'ka': `${SITE_ORIGIN}/ka${pathMap.ka}`,
        'en': `${SITE_ORIGIN}/en${pathMap.en}`,
        'ru': `${SITE_ORIGIN}/ru${pathMap.ru}`,
        'x-default': `${SITE_ORIGIN}/en${pathMap.en}`
      }
    }
  };
}
```

### HTML Output:

```html
<link rel="canonical" href="https://legal.ge/ka/news/article-slug" />
<link rel="alternate" hreflang="ka" href="https://legal.ge/ka/news/article-slug" />
<link rel="alternate" hreflang="en" href="https://legal.ge/en/news/article-slug" />
<link rel="alternate" hreflang="ru" href="https://legal.ge/ru/news/article-slug" />
<link rel="alternate" hreflang="x-default" href="https://legal.ge/en/news/article-slug" />
```

---

## 8. ⚡ Performance Optimization

### Core Web Vitals:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60
  },
  
  // Compile optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Static exports for specific pages
  experimental: {
    optimizeCss: true
  }
};
```

---

## 9. 📈 Analytics & Tracking

### Google Analytics (რეკომენდაცია):

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
```

---

## 10. 🎯 SEO Checklist

### ✅ On-Page SEO
- [x] უნიკალური `<title>` თითოეულ გვერდზე
- [x] მეტა აღწერები (160 სიმბოლომდე)
- [x] H1 თეგი თითოეულ გვერდზე
- [x] სემანტიკური HTML5 ელემენტები
- [x] Alt ტექსტები ყველა სურათზე
- [x] შიდა ბმულები (internal linking)

### ✅ Technical SEO
- [x] XML Sitemap
- [x] Robots.txt
- [x] Canonical URLs
- [x] Hreflang tags
- [x] Structured Data (JSON-LD)
- [x] Mobile-responsive
- [x] HTTPS
- [x] Fast loading (<3s)

### ✅ Content SEO
- [x] კონტენტის რეგულარული განახლება
- [x] საკვანძო სიტყვების ოპტიმიზაცია
- [x] შიდა ბმულები მსგავს კონტენტზე
- [x] გარე ბმულები ავტორიტეტულ წყაროებზე

---

*განახლებულია: 2025-01-21*