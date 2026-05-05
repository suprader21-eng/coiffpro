import { NextRequest, NextResponse } from 'next/server'
import { getSumUpAuthUrl } from '@/lib/sumup'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const salonId = searchParams.get('salonId')
  if (!salonId) return NextResponse.json({ error: 'salonId manquant' }, { status: 400 })
  const authUrl = getSumUpAuthUrl(salonId)
  return NextResponse.redirect(authUrl)
}
