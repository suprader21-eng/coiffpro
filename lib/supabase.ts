import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SRK  = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Client navigateur (côté client uniquement)
 * Singleton par module — session stockée dans localStorage
 */
export function createBrowserClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  })
}

// Singleton pour le navigateur
let _browserClient: ReturnType<typeof createBrowserClient> | null = null
export function getBrowserClient() {
  if (typeof window === 'undefined') return createBrowserClient()
  if (!_browserClient) _browserClient = createBrowserClient()
  return _browserClient
}

/**
 * Client admin serveur (API routes uniquement — jamais côté client)
 * Appelé à la demande pour éviter l'erreur au build
 */
export function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SRK, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Types
export type Salon = {
  id: string; slug: string; name: string; email: string; phone: string
  address: string; city: string; description: string; instagram: string
  google_link: string; google_maps_embed: string
  primary_color: string; accent_color: string
  status: string; trial_ends_at: string
  stripe_customer_id: string; stripe_subscription_id: string
  sumup_merchant_code: string; sumup_access_token: string
}
export type Employee = {
  id: string; salon_id: string; name: string; role: string; bio: string
  color: string; rating: number; review_count: number
  specialties: string[]; is_active: boolean; is_owner: boolean; sort_order: number
}
export type Service = {
  id: string; salon_id: string; name: string; description: string
  category: string; duration_minutes: number; price_cents: number
  is_active: boolean; sort_order: number
}
export type Client = {
  id: string; salon_id: string; name: string; phone: string; email: string
  notes: string; visit_count: number; total_spent_cents: number
  loyalty_points: number; gift_available: boolean; last_visit_at: string
}
export type Appointment = {
  id: string; salon_id: string; scheduled_at: string; status: string
  price_cents: number; final_price_cents: number; paid: boolean
  payment_method: string; client_note: string
  client?: Client; service?: Service; employee?: Employee
}
