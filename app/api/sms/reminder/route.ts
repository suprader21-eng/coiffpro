import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendReminder } from '@/lib/sms'
import { addHours } from 'date-fns'

// Appelé automatiquement toutes les heures par Vercel Cron
// Envoie les rappels 24h avant chaque RDV
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const now = new Date()

  // RDVs dans la fenêtre 20h-28h (= rappel 24h avant)
  const { data: appointments } = await db.from('appointments')
    .select('*, client:clients(name,phone), service:services(name), salon:salons(name,phone,notification_settings)')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('scheduled_at', addHours(now, 20).toISOString())
    .lte('scheduled_at', addHours(now, 28).toISOString())

  let sent = 0, failed = 0

  for (const appt of appointments || []) {
    // Respecter le paramètre du salon
    const ns = appt.salon?.notification_settings as Record<string,boolean>|null
    if (ns && ns.reminder_24h === false) { continue }
    const d = new Date(appt.scheduled_at)
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const date = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    const result = await sendReminder({
      clientName: appt.client.name.split(' ')[0],
      clientPhone: appt.client.phone,
      serviceName: appt.service?.name || 'votre RDV',
      date,
      time,
      salonName: appt.salon.name,
      salonPhone: appt.salon.phone,
    })

    if (result.success) {
      await db.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)
      await db.from('sms_logs').insert({
        salon_id: appt.salon_id,
        client_id: appt.client_id,
        appointment_id: appt.id,
        type: 'reminder',
        phone: appt.client.phone,
        message: `Rappel RDV ${date} ${time}`,
        status: 'sent',
      })
      sent++
    } else {
      failed++
    }
  }

  return NextResponse.json({
    success: true,
    processed: (appointments || []).length,
    sent, failed,
    timestamp: now.toISOString(),
  })
}
