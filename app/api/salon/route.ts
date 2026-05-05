import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le token avec le client anon
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token)

    if (userErr || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Utiliser le service role pour bypasser RLS
    const admin = getSupabaseAdmin()
    const { data: salon, error: salonErr } = await admin
      .from('salons')
      .select('*')
      .eq('email', user.email)
      .single()

    if (salonErr || !salon) {
      return NextResponse.json({ error: 'Salon introuvable', email: user.email }, { status: 404 })
    }

    return NextResponse.json({ salon, user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
