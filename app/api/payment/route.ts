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

  // Marquer le RDV comme payé
  await db.from('appointments').update({
    paid: true,
    payment_method: method,
    discount_type: discountType || null,
    discount_value: discountValue || 0,
    final_price_cents: final,
    status: 'completed',
  }).eq('id', appointmentId)

  // Enregistrer le paiement
  await db.from('payments').insert({
    salon_id: salonId,
    appointment_id: appointmentId,
    amount_cents: original,
    discount_cents: discount,
    final_cents: final,
    method,
    status: 'completed',
    ...(method === 'sumup' ? {} : {}),
  })

  // ── Mettre à jour le CRM client ──
  if (appt.client_id) {
    const { data: client } = await db.from('clients')
      .select('visit_count, total_spent_cents')
      .eq('id', appt.client_id).single()

    if (client) {
      const newVisitCount = (client.visit_count || 0) + 1
      const newTotalSpent = (client.total_spent_cents || 0) + final
      // Fidélité : cadeau tous les 10 visites
      const giftAvailable = newVisitCount % 10 === 0

      await db.from('clients').update({
        visit_count:        newVisitCount,
        total_spent_cents:  newTotalSpent,
        last_visit_at:      new Date().toISOString(),
        ...(giftAvailable ? { gift_available: true } : {}),
      }).eq('id', appt.client_id)
    }
  }

  return NextResponse.json({ success: true, final_price_cents: final })
}
