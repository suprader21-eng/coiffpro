import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ salons: [] })
  }

  const db = getSupabaseAdmin()

  const { data: salons, error } = await db
    .from('salons')
    .select('id, name, slug, city, address, description, primary_color, accent_color, logo_url')
    .in('status', ['active', 'trialing'])
    .or(`city.ilike.%${q}%,address.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ salons: salons || [] })
}
