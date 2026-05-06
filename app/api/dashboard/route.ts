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
  const { data: salon } = await admin.from('salons').select('id, name, slug, phone').eq('email', user.email!).single()
  return salon ? { salon, admin } : null
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await verifyAndGetSalon(req)
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { salon, admin } = ctx
    const body = await req.json()
    const { action, data, id } = body

    switch (action) {

      /* ── EQUIPE ── */
      case 'add_employee': {
        const { data: row, error } = await admin.from('employees').insert({
          salon_id: salon.id, ...data, specialties: [], rating: 5.0, review_count: 0
        }).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: row })
      }
      case 'toggle_employee': {
        const { error } = await admin.from('employees').update({ is_active: data.is_active }).eq('id', id).eq('salon_id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      /* ── SERVICES ── */
      case 'add_service': {
        const { data: row, error } = await admin.from('services').insert({ salon_id: salon.id, ...data }).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: row })
      }
      case 'toggle_service': {
        const { error } = await admin.from('services').update({ is_active: data.is_active }).eq('id', id).eq('salon_id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      /* ── SALON / PARAMS ── */
      case 'update_salon': {
        const { error } = await admin.from('salons').update(data).eq('id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      /* ── CLIENTS ── */
      case 'add_client': {
        const { data: row, error } = await admin.from('clients').insert({ salon_id: salon.id, ...data }).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: row })
      }
      case 'update_client_notes': {
        const { error } = await admin.from('clients').update({ notes: data.notes }).eq('id', id).eq('salon_id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      /* ── RDV ── */
      case 'add_appointment': {
        // Trouver ou créer le client par téléphone
        const { data: existing } = await admin.from('clients').select('id').eq('salon_id', salon.id).eq('phone', data.phone).maybeSingle()
        let clientId: string
        if (existing) {
          clientId = existing.id
        } else {
          const { data: newClient, error: cErr } = await admin.from('clients').insert({
            salon_id: salon.id, name: data.clientName, phone: data.phone, email: data.email || null
          }).select('id').single()
          if (cErr || !newClient) return NextResponse.json({ error: 'Erreur création client' }, { status: 400 })
          clientId = newClient.id
        }

        const { data: svc } = await admin.from('services').select('price_cents, duration_minutes').eq('id', data.serviceId).single()

        const scheduledAt = new Date(`${data.date}T${data.time}:00`).toISOString()
        const { data: appt, error: aErr } = await admin.from('appointments').insert({
          salon_id: salon.id,
          client_id: clientId,
          service_id: data.serviceId,
          employee_id: data.employeeId || null,
          scheduled_at: scheduledAt,
          duration_minutes: svc?.duration_minutes || 30,
          price_cents: svc?.price_cents || 0,
          status: 'confirmed',
          source: 'manual',
          client_note: data.note || null,
        }).select('*, client:clients(name,phone), service:services(name,price_cents), employee:employees(name,color)').single()

        if (aErr || !appt) return NextResponse.json({ error: aErr?.message || 'Erreur RDV' }, { status: 400 })
        return NextResponse.json({ data: appt })
      }

      /* ── PRODUITS ── */
      case 'add_product': {
        const { data: row, error } = await admin.from('products').insert({ salon_id: salon.id, ...data }).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ data: row })
      }
      case 'update_product_stock': {
        const { error } = await admin.from('products').update({ stock_quantity: data.stock_quantity }).eq('id', id).eq('salon_id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }
      case 'delete_product': {
        const { error } = await admin.from('products').delete().eq('id', id).eq('salon_id', salon.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue: ' + action }, { status: 400 })
    }
  } catch (e: any) {
    console.error('Dashboard API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
