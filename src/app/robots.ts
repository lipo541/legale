import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.baseUrl

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/', // Explicitly allow all other pages
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
          '/messages',
          '/*/messages',
          
          // API routes
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
