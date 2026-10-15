import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPush } from '@/lib/push-server'

// POST /api/notify/push
// Utilisé par les routes internes pour envoyer un push à un ou plusieurs coiffeurs.
// Body: { userIds: string[], title: string, body: string, data?: Record<string,string> }
// Requiert un Bearer token valide (token Supabase de l'utilisateur connecté).

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const { userIds, title, body, data } = await req.json()

  if (!userIds?.length || !title || !body) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const result = await sendPush({ userIds, title, body, data })
  if (!result.success) { const r = result as { success: false; error: string }; return NextResponse.json({ error: r.error }, { status: 502 }) }

  return NextResponse.json({ success: true, id: result.id })
}
