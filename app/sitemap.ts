import { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://coiffpro.fr'

  const db = getSupabaseAdmin()
  const { data: salons } = await db
    .from('salons')
    .select('slug, updated_at')
    .in('status', ['active', 'trialing'])

  const salonUrls: MetadataRoute.Sitemap = (salons || []).map(s => ({
    url: `${base}/book/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/pro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...salonUrls,
  ]
}
