import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/admin/', '/login/', '/register/'] },
    ],
    sitemap: 'https://coiffpro.fr/sitemap.xml',
  }
}
