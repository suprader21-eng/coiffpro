import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendReviewRequest, sendLoyaltyReward, sendCampaign, sendReactivation } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, appointmentId, clientId, salonId, campaignId } = body
    const db = getSupabaseAdmin()

    // ── Demande d'avis Google (2h après RDV) ──
    if (type === 'review_request' && appointmentId) {
      const { data: appt } = await db.from('appointments')
        .select('*, client:clients(name,phone), salon:salons(name,google_link)')
        .eq('id', appointmentId).single()

      if (!appt || appt.review_sent) return NextResponse.json({ message: 'Skip' })

      const result = await sendReviewRequest({
        clientName: appt.client.name.split(' ')[0],
        clientPhone: appt.client.phone,
        salonName: appt.salon.name,
        googleLink: appt.salon.google_link || 'g.page/mon-salon',
      })

      if (result.success) {
        await db.from('appointments').update({ review_sent: true }).eq('id', appointmentId)
        await db.from('sms_logs').insert({
          salon_id: appt.salon_id, client_id: appt.client_id,
          appointment_id: appointmentId, type: 'review',
          phone: appt.client.phone, message: 'Demande avis Google', status: 'sent',
        })
      }
      return NextResponse.json(result)
    }

    // ── SMS fidélité (10ème visite) ──
    if (type === 'loyalty' && clientId && salonId) {
      const { data: client } = await db.from('clients').select('*').eq('id', clientId).single()
      const { data: salon } = await db.from('salons').select('name').eq('id', salonId).single()

      if (!client || !salon) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

      const result = await sendLoyaltyReward({
        clientName: client.name.split(' ')[0],
        clientPhone: client.phone,
        salonName: salon.name,
      })

      if (result.success) {
        await db.from('clients').update({ gift_available: false, gift_given_at: new Date().toISOString() }).eq('id', clientId)
        await db.from('sms_logs').insert({
          salon_id: salonId, client_id: clientId, type: 'loyalty',
          phone: client.phone, message: 'Cadeau fidélité', status: 'sent',
        })
      }
      return NextResponse.json(result)
    }

    // ── Relance client inactif ──
    if (type === 'reactivation' && clientId && salonId) {
      const { data: client } = await db.from('clients').select('*').eq('id', clientId).single()
      const { data: salon } = await db.from('salons').select('name, slug').eq('id', salonId).single()
      if (!client || !salon) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

      const weeksSince = body.weeksSince || 6
      const result = await sendReactivation({
        clientName: client.name.split(' ')[0],
        clientPhone: client.phone,
        salonName: salon.name,
        bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${salon.slug}`,
        weeksSince,
      })

      if (result.success) {
        await db.from('sms_logs').insert({
          salon_id: salonId, client_id: clientId, type: 'campaign',
          phone: client.phone, message: `Relance inactif ${weeksSince}sem`, status: 'sent',
        })
      }
      return NextResponse.json(result)
    }

    // ── Campagne SMS ──
    if (type === 'campaign' && campaignId) {
      const { data: campaign } = await db.from('sms_campaigns')
        .select('*, salon:salons(name)').eq('id', campaignId).single()
      if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

      const { data: clients } = await db.from('clients')
        .select('phone').eq('salon_id', campaign.salon_id)
      if (!clients?.length) return NextResponse.json({ message: 'Aucun client' })

      const result = await sendCampaign({
        phones: clients.map(c => c.phone),
        message: campaign.message,
        salonName: campaign.salon.name,
      })

      await db.from('sms_campaigns').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: result.sent,
      }).eq('id', campaignId)

      return NextResponse.json({ success: true, sent: result.sent, total: result.total })
    }

    return NextResponse.json({ error: 'Type SMS invalide' }, { status: 400 })

  } catch (err: any) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
