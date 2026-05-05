// ============================================================
// CoiffPro — SumUp OAuth + Paiements
// Chaque barber connecte SON propre compte SumUp
// ============================================================

const SUMUP_API  = 'https://api.sumup.com'
const SUMUP_AUTH = 'https://api.sumup.com/authorize'
const CLIENT_ID  = process.env.SUMUP_CLIENT_ID!
const CLIENT_SECRET = process.env.SUMUP_CLIENT_SECRET!
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL!

// ── ÉTAPE 1 : Générer l'URL d'autorisation ──
// Le barber clique → redirigé vers SumUp pour connecter son compte
export function getSumUpAuthUrl(salonId: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/api/sumup/callback`,
    scope: 'payments',
    state: salonId, // On retrouve le salon au retour
  })
  return `${SUMUP_AUTH}?${params.toString()}`
}

// ── ÉTAPE 2 : Échanger le code contre un token (callback) ──
// SumUp appelle notre callback avec un code → on l'échange contre un token
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
} | null> {
  try {
    const res = await fetch(`${SUMUP_API}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${APP_URL}/api/sumup/callback`,
      }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Rafraîchir le token expiré ──
export async function refreshToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUMUP_API}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token
  } catch {
    return null
  }
}

// ── ÉTAPE 3 : Créer un checkout (lien de paiement) ──
// Utilise le token du barber → l'argent va directement sur son compte
export async function createCheckout({
  accessToken,
  amountCents,
  description,
  reference,
  redirectUrl,
}: {
  accessToken: string
  amountCents: number
  description: string
  reference: string
  redirectUrl: string
}) {
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: reference,
      amount: amountCents / 100,
      currency: 'EUR',
      description,
      redirect_url: redirectUrl,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erreur SumUp checkout')
  }
  return res.json()
  // Retourne { id, hosted_checkout_url } → rediriger le client vers hosted_checkout_url
}

// ── Vérifier le statut d'un paiement ──
export async function getCheckoutStatus(accessToken: string, checkoutId: string) {
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts/${checkoutId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  return res.json()
  // status: 'PENDING' | 'COMPLETED' | 'FAILED'
}

// ── Récupérer les infos du marchand connecté ──
export async function getMerchantInfo(accessToken: string) {
  const res = await fetch(`${SUMUP_API}/v0.1/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  return res.json()
  // Retourne { merchant_profile: { merchant_code, business_name } }
}

// ── Calcul remise ──
export function applyDiscount(
  priceCents: number,
  discountType?: 'percent' | 'fixed' | null,
  discountValue?: number
): { original: number; discount: number; final: number } {
  if (!discountType || !discountValue) {
    return { original: priceCents, discount: 0, final: priceCents }
  }
  const discount = discountType === 'percent'
    ? Math.round(priceCents * discountValue / 100)
    : Math.min(discountValue * 100, priceCents)
  return { original: priceCents, discount, final: Math.max(0, priceCents - discount) }
}

export const formatPrice = (cents: number) =>
  (cents / 100).toFixed(2).replace('.', ',') + ' €'
