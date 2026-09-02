import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'

type Props = { params: { salonId: string }; children: React.ReactNode }

async function getSalon(salonId: string) {
  const db = getSupabaseAdmin()
  let { data } = await db.from('salons').select('name,description,city,address,phone,slug,primary_color,logo_url').eq('slug', salonId).maybeSingle()
  if (!data) {
    const { data: byId } = await db.from('salons').select('name,description,city,address,phone,slug,primary_color,logo_url').eq('id', salonId).maybeSingle()
    data = byId
  }
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const salon = await getSalon(params.salonId)
  if (!salon) return { title: 'Salon introuvable — CoiffPro' }

  const title = `${salon.name} — Réservation en ligne | CoiffPro`
  const description = salon.description
    ? salon.description.slice(0, 155) + (salon.description.length > 155 ? '…' : '')
    : `Réservez chez ${salon.name} à ${salon.city}. Agenda en ligne, confirmation immédiate.`
  const url = `https://coiffpro.fr/book/${salon.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'CoiffPro',
    },
    alternates: { canonical: url },
    other: {
      // schema.org LocalBusiness injecté via script JSON-LD dans le layout
      'schema-slug': salon.slug,
    },
  }
}

export default async function BookLayout({ children, params }: Props) {
  const salon = await getSalon(params.salonId)

  const jsonLd = salon ? {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: salon.name,
    description: salon.description || undefined,
    address: salon.address ? {
      '@type': 'PostalAddress',
      streetAddress: salon.address,
      addressLocality: salon.city,
      addressCountry: 'FR',
    } : undefined,
    telephone: salon.phone || undefined,
    url: `https://coiffpro.fr/book/${salon.slug}`,
    image: salon.logo_url || undefined,
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Credit Card',
    openingHoursSpecification: undefined,
    potentialAction: {
      '@type': 'ReserveAction',
      target: `https://coiffpro.fr/book/${salon.slug}`,
      result: { '@type': 'Reservation', name: 'Réservation coiffeur' },
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
