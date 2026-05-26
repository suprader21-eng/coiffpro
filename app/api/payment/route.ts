import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createCheckout,  applyDiscount } from '@/lib/sumup'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { appointmentId, method, discountType, discountValue, salonId } = body
  const db = getSupabaseAdmin()

  // Charger le RDV
  const { data: appt } = await db.from('appointments')
    .select('*, service:services(*), salon:salons(sumup_merchant_code, sumup_access_token, name)')
    .eq('id', appointmentId).single()
  if (!appt) return NextResponse.json({ error: 'RDV introuvable' }, { status: 404 })

  const { original, discount, final } = applyDiscount(appt.price_cents, discountType, discountValue)

  // Mettre à jour le RDV avec la remise
  await db.from('appointments').update({
    discount_type: discountType || null,
    discount_value: discountValue || 0,
    final_price_cents: final,
    payment_method: method,
  }).eq('id', appointmentId)

  // Paiement SumUp
  if (method === 'sumup') {
    try {
      const token = appt.salon.sumup_access_token
      if (!token) {
        return NextResponse.json({ error: 'SumUp non connecté — allez dans Paramètres pour connecter votre compte' }, { status: 400 })
      }
      console.log('[Payment] SumUp token present:', !!token, '| amount:', final, 'cents')
      const checkout = await createCheckout({
        accessToken: token,
        amountCents: final,
        description: appt.service?.name || 'Prestation',
        reference: `appt-${appointmentId}`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&appt=${appointmentId}`,
      })
      // Log paiement
      await db.from('payments').insert({
        salon_id: salonId,
        appointment_id: appointmentId,
        amount_cents: original,
        discount_cents: discount,
        final_cents: final,
        method: 'sumup',
        sumup_checkout_id: checkout.id,
        status: 'pending',
      })
      return NextResponse.json({ success: true, checkoutUrl: checkout.hosted_checkout_url, checkoutId: checkout.id })
    } catch (err: any) {
      return NextResponse.json({ error: 'Erreur SumUp: ' + err.message }, { status: 500 })
    }
  }

  // Paiement cash ou carte (enregistrement direct)
  await db.from('appointments').update({ paid: true, payment_method: method }).eq('id', appointmentId)
  await db.from('payments').insert({
    salon_id: salonId,
    appointment_id: appointmentId,
    amount_cents: original,
    discount_cents: discount,
    final_cents: final,
    method,
    status: 'completed',
  })

  return NextResponse.json({ success: true, final_price_cents: final })
}
