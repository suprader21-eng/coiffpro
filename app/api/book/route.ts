import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendConfirmation } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { salonId, serviceId, date, time, firstName, lastName, phone, employeeId, note } = body

    if (!salonId || !serviceId || !date || !time || !firstName || !phone) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    const { data: salon } = await db.from('salons')
      .select('id, name, phone, google_link, notification_settings')
      .eq('id', salonId).single()
    if (!salon) return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })

    const { data: service } = await db.from('services')
      .select('id, name, duration_minutes, price_cents')
      .eq('id', serviceId).single()

    // Créer ou retrouver le client
    const { data: existing } = await db.from('clients')
      .select('id').eq('salon_id', salonId).eq('phone', phone).maybeSingle()

    let clientId: string
    if (existing) {
      clientId = existing.id
    } else {
      const { data: newClient } = await db.from('clients').insert({
        salon_id: salonId,
        name: `${firstName} ${lastName}`.trim(),
        phone,
      }).select('id').single()
      if (!newClient) return NextResponse.json({ error: 'Erreur client' }, { status: 500 })
      clientId = newClient.id
    }

    // Créer le RDV
    const { data: appointment } = await db.from('appointments').insert({
      salon_id: salonId,
      client_id: clientId,
      service_id: serviceId,
      employee_id: employeeId || null,
      scheduled_at: new Date(`${date} ${time}`).toISOString(),
      duration_minutes: service?.duration_minutes || 30,
      price_cents: service?.price_cents || 0,
      status: 'confirmed',
      source: 'online',
      client_note: note || null,
    }).select('id').single()

    if (!appointment) return NextResponse.json({ error: 'Erreur RDV' }, { status: 500 })

    // Envoyer SMS de confirmation si activé
    const ns = (salon as any).notification_settings as Record<string,boolean>|null
    const smsEnabled = !ns || ns.confirmation !== false
    const smsResult = smsEnabled ? await sendConfirmation({
      clientName: firstName,
      clientPhone: phone,
      serviceName: service?.name || 'votre prestation',
      date,
      time,
      salonName: salon.name,
      salonPhone: salon.phone,
    }) : { success: false }

    // Logger le SMS
    if (smsResult.success) {
      await db.from('sms_logs').insert({
        salon_id: salonId,
        client_id: clientId,
        appointment_id: appointment.id,
        type: 'confirmation',
        phone,
        message: `Confirmation RDV ${date} ${time}`,
        status: 'sent',
      })
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      smsSent: smsResult.success,
    })

  } catch (err: any) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
