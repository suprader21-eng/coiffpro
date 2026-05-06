import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user) return null
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) return null

  return getSupabaseAdmin()
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: salons, error } = await admin
    .from('salons')
    .select('id,slug,name,owner_name,email,phone,city,status,plan,created_at,trial_ends_at,stripe_subscription_status,admin_notes,admin_message,custom_domain,primary_color,accent_color')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Counts per salon
  const enriched = await Promise.all((salons || []).map(async (s) => {
    const [{ count: clientCount }, { count: apptCount }, { count: empCount }] = await Promise.all([
      admin.from('clients').select('id', { count: 'exact', head: true }).eq('salon_id', s.id),
      admin.from('appointments').select('id', { count: 'exact', head: true }).eq('salon_id', s.id),
      admin.from('employees').select('id', { count: 'exact', head: true }).eq('salon_id', s.id).eq('is_active', true),
    ])
    return { ...s, client_count: clientCount ?? 0, appointment_count: apptCount ?? 0, employee_count: empCount ?? 0 }
  }))

  return NextResponse.json({ salons: enriched })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { action, id, data } = await req.json()

  switch (action) {
    case 'update_status': {
      const { error } = await admin.from('salons').update({ status: data.status }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    case 'save_notes': {
      const { error } = await admin.from('salons').update({ admin_notes: data.notes }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    case 'send_message': {
      const { error } = await admin.from('salons').update({ admin_message: data.message }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    case 'clear_message': {
      const { error } = await admin.from('salons').update({ admin_message: '' }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    case 'update_domain': {
      const { error } = await admin.from('salons').update({ custom_domain: data.domain }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }
}
