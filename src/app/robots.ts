import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge'

  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          // Admin and Dashboard pages (all locales)
          '/admin/*',
          '/*/admin/*',
          '/author-dashboard/*',
          '/*/author-dashboard/*',
          '/company-dashboard/*',
          '/*/company-dashboard/*',
          '/moderator-dashboard/*',
          '/*/moderator-dashboard/*',
          '/solo-specialist-dashboard/*',
          '/*/solo-specialist-dashboard/*',
          '/specialist-dashboard/*',
          '/*/specialist-dashboard/*',
          
          // User authentication and profile pages (all locales)
          '/login',
          '/*/login',
          '/register',
          '/*/register',
          '/complete-profile',
          '/*/complete-profile',
          '/profile',
          '/*/profile',
          
          // API routes
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
