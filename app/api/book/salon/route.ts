import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Route publique — utilise le service role pour bypasser RLS
// Accessible sans authentification (page de réservation client)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug manquant' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: salon } = await db.from('salons')
    .select('id,name,slug,description,address,city,phone,email,instagram,google_link,google_maps_embed,primary_color,accent_color,logo_url,rating,review_count')
    .eq('slug', slug)
    .single()

  if (!salon) return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })

  const [emps, svcs, hrs, pics, revs] = await Promise.all([
    db.from('employees').select('id,name,role,bio,color,rating,review_count,specialties,is_active').eq('salon_id', salon.id).eq('is_active', true).order('sort_order'),
    db.from('services').select('id,name,description,category,duration_minutes,price_cents,is_active').eq('salon_id', salon.id).eq('is_active', true).order('sort_order'),
    db.from('salon_hours').select('day_name,is_open,open_time,close_time').eq('salon_id', salon.id).order('day_index'),
    db.from('salon_photos').select('id,url,alt').eq('salon_id', salon.id).order('sort_order'),
    db.from('reviews').select('id,rating,comment,created_at, client:clients(name), employee:employees(name)').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(6),
  ])

  return NextResponse.json({
    salon,
    employees: emps.data || [],
    services:  svcs.data || [],
    hours:     hrs.data  || [],
    photos:    pics.data || [],
    reviews:   revs.data || [],
  })
}
