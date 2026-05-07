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

      // Personnalisation du message par client
      const OCTOPUSH_API = 'https://api.octopush.com/v1/public'
      const senderName = salonName.slice(0, 11).replace(/\s+/g, '')
      const chunks: { name: string; phone: string }[][] = []
      for (let i = 0; i < clients.length; i += 100) chunks.push(clients.slice(i, i + 100))

      let sent = 0, failed = 0
      for (const chunk of chunks) {
        for (const client of chunk) {
          const firstName = client.name.split(' ')[0] || client.name
          const personalised = campaign.message
            .replace(/\{prénom\}/gi, firstName)
            .replace(/\{prenom\}/gi, firstName)
            .replace(/\{salon\}/gi, salonName)
          try {
            const res = await fetch(`${OCTOPUSH_API}/sms-campaign/send`, {
              method: 'POST',
              headers: {
                'api-login': process.env.OCTOPUSH_API_LOGIN!,
                'api-key': process.env.OCTOPUSH_API_KEY!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipients: [{ phone_number: formatPhone(client.phone) }],
                text: personalised + '\nSTOP 36xxx',
                type: 'sms_premium',
                sender: senderName,
                purpose: 'marketing',
              }),
            })
            if (res.ok) sent++; else failed++
          } catch { failed++ }
        }
        if (chunks.length > 1) await new Promise(r => setTimeout(r, 100))
      }

      await db.from('sms_campaigns').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: sent,
      }).eq('id', campaignId)

      return NextResponse.json({ success: true, sent, failed, total: clients.length })
    }

    return NextResponse.json({ error: 'Type SMS invalide' }, { status: 400 })

  } catch (err: any) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/[\s.\-]/g, '')
  if (clean.startsWith('0'))  return '+33' + clean.slice(1)
  if (clean.startsWith('+'))  return clean
  if (clean.startsWith('33')) return '+' + clean
  return '+33' + clean
}
