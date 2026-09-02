// Server-side: envoie une notification push via l'API REST OneSignal.
// Utilisé depuis les route handlers Next.js (jamais dans du code client).

export type PushResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function sendPush(opts: {
  userIds: string[]        // Supabase user UUIDs (= OneSignal external IDs)
  title: string
  body: string
  data?: Record<string, string>
}): Promise<PushResult> {
  const appId  = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY

  if (!appId || !apiKey) return { success: false, error: 'OneSignal non configuré' }
  if (!opts.userIds.length) return { success: false, error: 'Aucun destinataire' }

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: opts.userIds },
        target_channel: 'push',
        headings: { fr: opts.title, en: opts.title },
        contents: { fr: opts.body,  en: opts.body  },
        data: opts.data || {},
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        priority: 10,
        ttl: 3600,
      }),
    })

    const json = await res.json()
    if (!res.ok) return { success: false, error: JSON.stringify(json.errors || json) }
    return { success: true, id: json.id }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' }
  }
}
