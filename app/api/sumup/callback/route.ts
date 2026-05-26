import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { exchangeCodeForToken, getMerchantInfo } from '@/lib/sumup'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code    = searchParams.get('code')
  const salonId = searchParams.get('state')
  const error   = searchParams.get('error')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !salonId) {
    return NextResponse.redirect(`${APP_URL}/dashboard?sumup=error`)
  }

  const tokens = await exchangeCodeForToken(code)
  if (!tokens) {
    return NextResponse.redirect(`${APP_URL}/dashboard?sumup=error`)
  }

  const merchantInfo = await getMerchantInfo(tokens.access_token)
  // SumUp peut retourner le code à différents endroits selon la version API
  const merchantCode =
    merchantInfo?.merchant_profile?.merchant_code ||
    merchantInfo?.merchant_code ||
    merchantInfo?.id ||
    salonId // fallback : utiliser l'id salon pour marquer comme connecté

  const db = getSupabaseAdmin()
  await db.from('salons').update({
    sumup_access_token: tokens.access_token,
    sumup_refresh_token: tokens.refresh_token ?? null,
    sumup_merchant_code: merchantCode,
    sumup_token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
  }).eq('id', salonId)

  return NextResponse.redirect(`${APP_URL}/dashboard?sumup=connected`)
}
