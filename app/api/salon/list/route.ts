import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city = searchParams.get('city')
  const cat  = searchParams.get('cat')

  const db = getSupabaseAdmin()

  let q = db.from('salons')
    .select('id,slug,name,tagline,city,address,accent_color,primary_color,phone,status,services(id,name,price_cents,category),employees(name)')
    .not('status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (city) q = q.ilike('city', `%${city}%`)

  const { data, error } = await q

  if (error) return NextResponse.json({ salons: [] })

  const salons = (data || []).map((s: any) => ({
    ...s,
    mainCat: s.services?.[0]?.category || 'Coupes',
  }))

  return NextResponse.json({ salons })
}
