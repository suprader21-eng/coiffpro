// ============================================================
// CoiffPro — SMS via Android SMS Gateway (auto-hébergé)
// https://github.com/capcom6/android-sms-gateway
//
// CONFIGURATION (.env.local) :
//   SMS_GATEWAY_URL=http://192.168.1.x:8080   ← IP de votre téléphone Android
//   SMS_GATEWAY_TOKEN=votre_token_secret
// ============================================================

// ── Types ──────────────────────────────────────────────────

type SMSResult =
  | { success: true;  messageId?: string }
  | { success: false; error: string; retryable: boolean }

// ── Transport bas niveau ────────────────────────────────────

const GATEWAY_URL   = process.env.SMS_GATEWAY_URL   || ''
const GATEWAY_TOKEN = process.env.SMS_GATEWAY_TOKEN || ''
const TIMEOUT_MS    = 10_000
const MAX_ATTEMPTS  = 3

function maskPhone(phone: string): string {
  if (phone.length < 6) return '****'
  return phone.slice(0, 4) + '****' + phone.slice(-4)
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Envoi SMS via Android SMS Gateway
 * Retry automatique (3 tentatives, backoff exponentiel) sur erreurs réseau/5xx
 */
export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    console.error('[SMS] SMS_GATEWAY_URL ou SMS_GATEWAY_TOKEN manquant')
    return { success: false, error: 'Gateway non configuré', retryable: false }
  }

  const masked = maskPhone(phone)
  const endpoint = `${GATEWAY_URL.replace(/\/$/, '')}/send-sms`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[SMS] Sending to ${masked}${attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : ''}`)

      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          },
          body: JSON.stringify({ phone: formatPhone(phone), message }),
        },
        TIMEOUT_MS
      )

      // 4xx → erreur définitive, pas de retry
      if (res.status >= 400 && res.status < 500) {
        const body = await res.json().catch(() => ({})) as Record<string, any>
        const errMsg = body.error || body.message || `HTTP ${res.status}`
        console.error(`[SMS] Failed (${res.status}) – ${errMsg} – no retry`)
        return { success: false, error: errMsg, retryable: false }
      }

      // 5xx → retryable
      if (!res.ok) {
        if (attempt < MAX_ATTEMPTS) {
          const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
          console.warn(`[SMS] Attempt ${attempt}/${MAX_ATTEMPTS} failed – retrying in ${delay / 1000}s`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        console.error(`[SMS] Failed after ${MAX_ATTEMPTS} attempts – HTTP ${res.status}`)
        return { success: false, error: `HTTP ${res.status}`, retryable: true }
      }

      // Succès
      const data = await res.json().catch(() => ({})) as Record<string, any>
      const messageId = data.id || data.messageId || data.message_id
      console.log(`[SMS] Success – messageId: ${messageId || 'n/a'} – to: ${masked}`)
      return { success: true, messageId }

    } catch (err: any) {
      const isAbort = err.name === 'AbortError'
      const errMsg = isAbort ? 'Timeout (10s)' : err.message
      if (attempt < MAX_ATTEMPTS) {
        const delay = Math.pow(2, attempt - 1) * 1000
        console.warn(`[SMS] Attempt ${attempt}/${MAX_ATTEMPTS} failed – retrying in ${delay / 1000}s`)
        await new Promise(r => setTimeout(r, delay))
      } else {
        console.error(`[SMS] Failed after ${MAX_ATTEMPTS} attempts – ${errMsg}`)
        return { success: false, error: errMsg, retryable: true }
      }
    }
  }

  return { success: false, error: 'Échec inconnu', retryable: true }
}

// ── Templates de messages ───────────────────────────────────
// Templates identiques à l'ancienne version Octopush — seul le transport a changé.

/** SMS confirmation de RDV (envoyé après réservation) */
export async function sendConfirmation({
  clientName, clientPhone, serviceName, date, time, salonName, salonPhone,
}: {
  clientName: string; clientPhone: string; serviceName: string
  date: string; time: string; salonName: string; salonPhone?: string
}): Promise<SMSResult> {
  const msg =
    `Bonjour ${clientName} ! ` +
    `RDV confirme : ${serviceName} le ${date} a ${time} chez ${salonName}.` +
    (salonPhone ? ` Annulation : ${salonPhone}` : ' Repondez STOP.')
  return sendSMS(clientPhone, msg)
}

/** SMS rappel 24h avant RDV (cron) */
export async function sendReminder({
  clientName, clientPhone, serviceName, date, time, salonName, salonPhone,
}: {
  clientName: string; clientPhone: string; serviceName: string
  date: string; time: string; salonName: string; salonPhone?: string
}): Promise<SMSResult> {
  const msg =
    `Rappel ${clientName} : "${serviceName}" ${date} a ${time} chez ${salonName}.` +
    (salonPhone ? ` Annulation : ${salonPhone}` : '')
  return sendSMS(clientPhone, msg)
}

/** SMS demande d'avis Google (2h après RDV) */
export async function sendReviewRequest({
  clientName, clientPhone, salonName, googleLink,
}: {
  clientName: string; clientPhone: string; salonName: string; googleLink: string
}): Promise<SMSResult> {
  const msg =
    `Merci pour votre visite chez ${salonName} ${clientName} ! ` +
    `Votre avis nous aide beaucoup : ${googleLink}`
  return sendSMS(clientPhone, msg)
}

/** SMS fidélité 10ème visite */
export async function sendLoyaltyReward({
  clientName, clientPhone, salonName, reward = 'un produit offert',
}: {
  clientName: string; clientPhone: string; salonName: string; reward?: string
}): Promise<SMSResult> {
  const msg =
    `Felicitations ${clientName} ! ` +
    `10 visites chez ${salonName} = ${reward} a votre prochain RDV !`
  return sendSMS(clientPhone, msg)
}

/** SMS relance client inactif */
export async function sendReactivation({
  clientName, clientPhone, salonName, bookingUrl, weeksSince,
}: {
  clientName: string; clientPhone: string; salonName: string
  bookingUrl: string; weeksSince: number
}): Promise<SMSResult> {
  const msg =
    `${clientName}, ca fait ${weeksSince} semaines ! ` +
    `Votre RDV chez ${salonName} vous attend : ${bookingUrl}`
  return sendSMS(clientPhone, msg)
}

/** Campagne SMS en masse avec personnalisation par client */
export async function sendCampaign({
  clients, message, salonName,
}: {
  clients: { name: string; phone: string }[]
  message: string
  salonName: string
}): Promise<{ sent: number; failed: number; total: number }> {
  let sent = 0, failed = 0

  for (const client of clients) {
    const firstName = client.name.split(' ')[0] || client.name
    const personalised = message
      .replace(/\{prénom\}/gi, firstName)
      .replace(/\{prenom\}/gi, firstName)
      .replace(/\{salon\}/gi, salonName)

    const result = await sendSMS(client.phone, personalised + '\nSTOP 36xxx')
    if (result.success) sent++
    else failed++
  }

  return { sent, failed, total: clients.length }
}

/** Vérifier que le gateway Android répond (health check) */
export async function getGatewayStatus(): Promise<{ online: boolean; error?: string }> {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    return { online: false, error: 'Gateway non configuré' }
  }
  try {
    const res = await fetchWithTimeout(
      `${GATEWAY_URL.replace(/\/$/, '')}/health`,
      { headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` } },
      5_000
    )
    return { online: res.ok }
  } catch (err: any) {
    return { online: false, error: err.message }
  }
}

// ── Format numéro ───────────────────────────────────────────

function formatPhone(phone: string): string {
  const clean = phone.replace(/[\s.\-]/g, '')
  if (clean.startsWith('0'))  return '+33' + clean.slice(1)
  if (clean.startsWith('+'))  return clean
  if (clean.startsWith('33')) return '+' + clean
  return '+33' + clean
}
