import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

async function verifyAndGetSalon(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user) return null
  const admin = getSupabaseAdmin()
  const { data: salon } = await admin.from('salons').select('id, name').eq('email', user.email!).single()
  return salon ? { salon, admin } : null
}

export async function GET(req: NextRequest) {
  const ctx = await verifyAndGetSalon(req)
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { salon, admin } = ctx
  const { data } = await admin
    .from('support_messages')
    .select('*')
    .eq('salon_id', salon.id)
    .order('created_at', { ascending: true })
  // Mark admin messages as read
  await admin.from('support_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('salon_id', salon.id)
    .eq('from_admin', true)
    .is('read_at', null)
  return NextResponse.json({ messages: data || [] })
}

export async function POST(req: NextRequest) {
  const ctx = await verifyAndGetSalon(req)
  if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { salon, admin } = ctx
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  const { data, error } = await admin.from('support_messages').insert({
    salon_id: salon.id,
    from_admin: false,
    message: message.trim(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: data })
}
