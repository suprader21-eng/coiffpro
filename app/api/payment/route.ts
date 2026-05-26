import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { applyDiscount } from '@/lib/sumup'

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

  // Paiement SumUp — enregistrement direct (terminal physique)
  // Le barber encaisse sur son terminal SumUp, on enregistre ici le paiement
  if (method === 'sumup') {
    await db.from('appointments').update({ paid: true, payment_method: 'sumup' }).eq('id', appointmentId)
    await db.from('payments').insert({
      salon_id: salonId,
      appointment_id: appointmentId,
      amount_cents: original,
      discount_cents: discount,
      final_cents: final,
      method: 'sumup',
      status: 'completed',
    })
    return NextResponse.json({ success: true, final_price_cents: final })
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
