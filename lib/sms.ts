// ============================================================
// CoiffPro — SMS via Octopush
// Site : octopush.com 🇫🇷
// Prix : ~0.045€/SMS France · Zéro abonnement · Paiement à l'usage
// Sender ID alphanumérique inclus gratuitement
// ============================================================
//
// CONFIGURATION (.env.local) :
//   OCTOPUSH_API_KEY=votre_cle_api
//   OCTOPUSH_API_LOGIN=votre@email.com
//   OCTOPUSH_SENDER=CoiffPro        ← affiché sur le téléphone du client
//
// CRÉER UN COMPTE :
//   1. octopush.com → S'inscrire (gratuit)
//   2. Créditer son compte (minimum 5€)
//   3. Paramètres → API → Copier login + clé API
// ============================================================

const OCTOPUSH_API = 'https://api.octopush.com/v1/public'

// Envoi SMS de base
export async function sendSMS(
  to: string,
  message: string,
  sender?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const senderName = (sender || process.env.OCTOPUSH_SENDER || 'CoiffPro')
    .slice(0, 11)
    .replace(/\s+/g, '')

  try {
    const res = await fetch(`${OCTOPUSH_API}/sms-campaign/send`, {
      method: 'POST',
      headers: {
        'api-login': process.env.OCTOPUSH_API_LOGIN!,
        'api-key': process.env.OCTOPUSH_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipients: [{ phone_number: formatPhone(to) }],
        text: message,
        type: 'sms_premium',   // sms_premium = avec accusé de réception
        sender: senderName,
        purpose: 'alert',      // alert = transactionnel (meilleure délivrabilité)
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Octopush error:', err)
      return { success: false, error: err.error_description || `Erreur ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.campaign_id }

  } catch (err: any) {
    console.error('Octopush SMS error:', err.message)
    return { success: false, error: err.message }
  }
}

// ── SMS confirmation RDV ──
export async function sendConfirmation({
  clientName, clientPhone, serviceName, date, time, salonName, salonPhone,
}: {
  clientName: string; clientPhone: string; serviceName: string
  date: string; time: string; salonName: string; salonPhone?: string
}) {
  const msg =
    `Bonjour ${clientName} ! ` +
    `RDV confirme : ${serviceName} le ${date} a ${time} chez ${salonName}.` +
    (salonPhone ? ` Annulation : ${salonPhone}` : ' Repondez STOP.')
  return sendSMS(clientPhone, msg, salonName)
}

// ── SMS rappel 24h avant ──
export async function sendReminder({
  clientName, clientPhone, serviceName, date, time, salonName, salonPhone,
}: {
  clientName: string; clientPhone: string; serviceName: string
  date: string; time: string; salonName: string; salonPhone?: string
}) {
  const msg =
    `Rappel ${clientName} : "${serviceName}" ${date} a ${time} chez ${salonName}.` +
    (salonPhone ? ` Annulation : ${salonPhone}` : '')
  return sendSMS(clientPhone, msg, salonName)
}

// ── SMS demande d'avis Google ──
export async function sendReviewRequest({
  clientName, clientPhone, salonName, googleLink,
}: {
  clientName: string; clientPhone: string; salonName: string; googleLink: string
}) {
  const msg =
    `Merci pour votre visite chez ${salonName} ${clientName} ! ` +
    `Votre avis nous aide beaucoup : ${googleLink}`
  return sendSMS(clientPhone, msg, salonName)
}

// ── SMS fidélité 10ème visite ──
export async function sendLoyaltyReward({
  clientName, clientPhone, salonName, reward = 'un produit offert',
}: {
  clientName: string; clientPhone: string; salonName: string; reward?: string
}) {
  const msg =
    `Felicitations ${clientName} ! ` +
    `10 visites chez ${salonName} = ${reward} a votre prochain RDV !`
  return sendSMS(clientPhone, msg, salonName)
}

// ── SMS relance client inactif ──
export async function sendReactivation({
  clientName, clientPhone, salonName, bookingUrl, weeksSince,
}: {
  clientName: string; clientPhone: string; salonName: string
  bookingUrl: string; weeksSince: number
}) {
  const msg =
    `${clientName}, ca fait ${weeksSince} semaines ! ` +
    `Votre RDV chez ${salonName} vous attend : ${bookingUrl}`
  return sendSMS(clientPhone, msg, salonName)
}

// ── Envoi campagne en masse ──
export async function sendCampaign({
  phones, message, salonName,
}: {
  phones: string[]; message: string; salonName: string
}) {
  const senderName = salonName.slice(0, 11).replace(/\s+/g, '')

  // Octopush accepte jusqu'à 1000 destinataires par requête
  const chunks: string[][] = []
  for (let i = 0; i < phones.length; i += 100) {
    chunks.push(phones.slice(i, i + 100))
  }

  let sent = 0, failed = 0

  for (const chunk of chunks) {
    try {
      const res = await fetch(`${OCTOPUSH_API}/sms-campaign/send`, {
        method: 'POST',
        headers: {
          'api-login': process.env.OCTOPUSH_API_LOGIN!,
          'api-key': process.env.OCTOPUSH_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: chunk.map(p => ({ phone_number: formatPhone(p) })),
          text: message + '\nSTOP 36xxx',
          type: 'sms_premium',
          sender: senderName,
          purpose: 'marketing',
        }),
      })
      if (res.ok) sent += chunk.length
      else failed += chunk.length
    } catch {
      failed += chunk.length
    }
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 100))
  }

  return { sent, failed, total: phones.length }
}

// ── Vérifier le solde ──
export async function getCredits(): Promise<{ credits: number } | null> {
  try {
    const res = await fetch(`${OCTOPUSH_API}/users/wallet`, {
      headers: {
        'api-login': process.env.OCTOPUSH_API_LOGIN!,
        'api-key': process.env.OCTOPUSH_API_KEY!,
      },
    })
    const data = await res.json()
    return { credits: data.wallet?.credit || 0 }
  } catch {
    return null
  }
}

// ── Format numéro FR ──
function formatPhone(phone: string): string {
  const clean = phone.replace(/[\s.\-]/g, '')
  if (clean.startsWith('0'))  return '+33' + clean.slice(1)
  if (clean.startsWith('+'))  return clean
  if (clean.startsWith('33')) return '+' + clean
  return '+33' + clean
}
