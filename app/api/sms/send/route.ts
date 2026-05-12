import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { sendReviewRequest, sendLoyaltyReward, sendCampaign, sendReactivation } from '@/lib/sms'

async function getSalonFromToken(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return null
  const db = getSupabaseAdmin()
  const { data: salon } = await db.from('salons').select('id').eq('email', user.email!).single()
  return salon
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, appointmentId, clientId, salonId, campaignId } = body
    const db = getSupabaseAdmin()

    // ── Demande d'avis Google (2h après RDV) ──
    if (type === 'review_request' && appointmentId) {
      const { data: appt } = await db.from('appointments')
        .select('*, client:clients(name,phone), salon:salons(name,google_link,notification_settings)')
        .eq('id', appointmentId).single()

      if (!appt || appt.review_sent) return NextResponse.json({ message: 'Skip' })
      const ns = appt.salon?.notification_settings as Record<string,boolean>|null
      if (ns && ns.review_request === false) return NextResponse.json({ message: 'Skip (désactivé)' })

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
      const { data: salon } = await db.from('salons').select('name,notification_settings').eq('id', salonId).single()

      if (!client || !salon) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
      const ns = salon.notification_settings as Record<string,boolean>|null
      if (ns && ns.loyalty === false) return NextResponse.json({ message: 'Skip (désactivé)' })

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
      const { data: salon } = await db.from('salons').select('name,slug,notification_settings').eq('id', salonId).single()
      if (!client || !salon) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
      const ns = salon.notification_settings as Record<string,boolean>|null
      if (ns && ns.reactivation === false) return NextResponse.json({ message: 'Skip (désactivé)' })

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
      // Vérifier l'authentification du salon
      const authSalon = await getSalonFromToken(req)

      const { data: campaign } = await db.from('sms_campaigns')
        .select('*, salon:salons(id,name)').eq('id', campaignId).single()
      if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

      // Vérifier que la campagne appartient bien au salon authentifié
      if (authSalon && campaign.salon_id !== authSalon.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }

      if (campaign.status === 'sent') {
        return NextResponse.json({ error: 'Campagne déjà envoyée' }, { status: 400 })
      }

      const { data: clients } = await db.from('clients')
        .select('name, phone').eq('salon_id', campaign.salon_id)
      if (!clients?.length) return NextResponse.json({ message: 'Aucun client', sent: 0, total: 0 })

      const salonName: string = (campaign.salon as any).name || 'votre salon'

      // Délégué à sendCampaign dans lib/sms.ts (Android SMS Gateway)
      const result = await sendCampaign({
        clients,
        message: campaign.message,
        salonName,
      })

      await db.from('sms_campaigns').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: result.sent,
      }).eq('id', campaignId)

      return NextResponse.json({ success: true, sent: result.sent, failed: result.failed, total: result.total })
    }

    return NextResponse.json({ error: 'Type SMS invalide' }, { status: 400 })

  } catch (err: any) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
