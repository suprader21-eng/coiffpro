import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await sb.auth.getUser(token)
  return user || null
}

// GET — récupère le client + ses RDV
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Chercher le client lié à cet utilisateur
  const { data: client } = await db.from('clients')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!client) return NextResponse.json({ client: null, appointments: [] })

  // Récupérer ses RDV (passés + à venir)
  const { data: appointments } = await db.from('appointments')
    .select('*, service:services(name,duration_minutes,price_cents), employee:employees(name,color), salon:salons(name,slug,phone)')
    .eq('client_id', client.id)
    .order('scheduled_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ client, appointments: appointments || [] })
}

// POST — actions : link_account | cancel | reschedule
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = getSupabaseAdmin()
  const body = await req.json()
  const { action } = body

  // ── Lier le compte auth au client existant (par téléphone) ──
  if (action === 'link_account') {
    const { phone, salonId } = body
    if (!phone) return NextResponse.json({ error: 'Téléphone requis' }, { status: 400 })

    // Chercher par téléphone (nettoyage)
    const cleanPhone = phone.replace(/[\s.\-]/g, '')
    const { data: existing } = await db.from('clients')
      .select('id, auth_user_id')
      .eq('phone', phone)
      .eq('salon_id', salonId)
      .maybeSingle()

    if (existing) {
      // Lier si pas déjà lié
      if (!existing.auth_user_id) {
        await db.from('clients').update({ auth_user_id: user.id }).eq('id', existing.id)
      }
      const { data: client } = await db.from('clients').select('*').eq('id', existing.id).single()
      return NextResponse.json({ client })
    }

    // Client non trouvé → créer + lier
    const { data: newClient } = await db.from('clients').insert({
      salon_id: salonId,
      name: body.name || user.email?.split('@')[0] || 'Client',
      phone,
      email: user.email || null,
      auth_user_id: user.id,
    }).select().single()

    return NextResponse.json({ client: newClient })
  }

  // ── Annuler un RDV ──
  if (action === 'cancel') {
    const { appointmentId } = body

    // Vérifier que ce RDV appartient bien au client lié
    const { data: client } = await db.from('clients')
      .select('id').eq('auth_user_id', user.id).maybeSingle()
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const { data: appt } = await db.from('appointments')
      .select('id, scheduled_at, client_id')
      .eq('id', appointmentId)
      .eq('client_id', client.id)
      .single()
    if (!appt) return NextResponse.json({ error: 'RDV introuvable' }, { status: 404 })

    // Annulation seulement si dans +2h
    const diff = new Date(appt.scheduled_at).getTime() - Date.now()
    if (diff < 2 * 3600 * 1000) {
      return NextResponse.json({ error: 'Annulation impossible moins de 2h avant le RDV' }, { status: 400 })
    }

    await db.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
