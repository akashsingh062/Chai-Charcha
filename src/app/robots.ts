import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://chai-charcha.vercel.app";

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/api/auth/get-session',
      ],
      disallow: [
        '/api/',
        '/settings',
        '/notifications',
        '/messages',
        '/auth/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
