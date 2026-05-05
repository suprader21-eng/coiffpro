import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, ownerName, phone, salonName, city, address,
            postalCode, description, instagram, hours, services, employees } = body

    if (!email || !password || !salonName) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // 1. Créer le compte Supabase Auth
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { full_name: ownerName }
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // 2. Slug unique
    const base = salonName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const slug = `${base}-${Date.now().toString(36)}`

    // 3. Créer le client Stripe
    const customer = await stripe.customers.create({
      email,
      name: ownerName || salonName,
      metadata: { salonName, slug }
    })

    // 4. Créer le salon en base (statut 'trialing' — activé par Stripe webhook)
    const { data: salon, error: salonErr } = await db.from('salons').insert({
      slug, owner_name: ownerName || '', email, phone: phone || '',
      name: salonName, city: city || '', address: address || '',
      postal_code: postalCode || '', description: description || '',
      instagram: instagram || '', status: 'trialing',
      primary_color: '#1a1a1a', accent_color: '#c8a96e',
      plan: 'pro', plan_price: 5000,
      stripe_customer_id: customer.id,
    }).select('id').single()

    if (salonErr || !salon) {
      return NextResponse.json({ error: 'Erreur création salon: ' + salonErr?.message }, { status: 500 })
    }

    const salonId = salon.id

    // 5. Insérer horaires, services, employés
    const defaultHours = hours?.length ? hours : [
      { day_index:0, day_name:'Lundi',    is_open:false, open_time:'09:00', close_time:'19:00' },
      { day_index:1, day_name:'Mardi',    is_open:true,  open_time:'09:00', close_time:'19:00' },
      { day_index:2, day_name:'Mercredi', is_open:true,  open_time:'09:00', close_time:'19:00' },
      { day_index:3, day_name:'Jeudi',    is_open:true,  open_time:'09:00', close_time:'20:00' },
      { day_index:4, day_name:'Vendredi', is_open:true,  open_time:'09:00', close_time:'20:00' },
      { day_index:5, day_name:'Samedi',   is_open:true,  open_time:'08:30', close_time:'18:00' },
      { day_index:6, day_name:'Dimanche', is_open:false, open_time:'09:00', close_time:'17:00' },
    ]
    await db.from('salon_hours').insert(defaultHours.map((h: any) => ({ ...h, salon_id: salonId })))

    const svcs = services?.length ? services.map((s: any, i: number) => ({
      salon_id: salonId, name: s.name, category: s.category || 'Coupes',
      duration_minutes: s.duration || 30,
      price_cents: Math.round((s.price || 20) * 100),
      sort_order: i, is_active: true
    })) : [
      { salon_id: salonId, name: 'Coupe Homme',   category: 'Coupes',  duration_minutes: 30, price_cents: 2200, sort_order: 0 },
      { salon_id: salonId, name: 'Coupe + Barbe', category: 'Barbier', duration_minutes: 50, price_cents: 3600, sort_order: 1 },
      { salon_id: salonId, name: 'Barbe',         category: 'Barbier', duration_minutes: 25, price_cents: 1800, sort_order: 2 },
      { salon_id: salonId, name: 'Dégradé',       category: 'Coupes',  duration_minutes: 35, price_cents: 2800, sort_order: 3 },
    ]
    await db.from('services').insert(svcs)

    const empList = employees?.filter((e: any) => e.name?.trim()) || []
    const defaultEmps = empList.length ? empList : [{ name: ownerName || salonName, role: 'Gérant(e)', is_owner: true }]
    await db.from('employees').insert(defaultEmps.map((e: any, i: number) => ({
      salon_id: salonId, name: e.name, role: e.role || 'Coiffeur(se)',
      is_owner: e.is_owner || i === 0, is_active: true, sort_order: i,
      color: '#c8a96e', specialties: [], rating: 5.0, review_count: 0
    })))

    // 6. Créer la session Stripe Checkout
    //    - trial_period_days: 14 jours gratuits
    //    - Carte enregistrée mais pas débitée pendant l'essai
    //    - Après 14j → prélèvement automatique 50€/mois jusqu'à résiliation
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { salonId, slug }
      },
      metadata: { salonId, slug },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/welcome`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'fr',
      custom_text: {
        submit: { message: '14 jours gratuits · Résiliez quand vous voulez · 50€/mois ensuite' }
      }
    })

    return NextResponse.json({
      success: true,
      salonId,
      slug,
      checkoutUrl: session.url, // → Redirige vers Stripe
      message: 'Compte créé ! Redirection vers le paiement…'
    })

  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erreur serveur: ' + err.message }, { status: 500 })
  }
}
