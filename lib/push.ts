// Client-side OneSignal initialization — Capacitor native (iOS/Android) only.
// Dynamically imported so Next.js SSR is not affected.

export async function initOneSignal(externalId: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const { OneSignal } = await import('@onesignal/capacitor-plugin')
    OneSignal.initialize(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!)
    await OneSignal.Notifications.requestPermission(true)
    await OneSignal.login(externalId)
  } catch {}
}

export async function logoutOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const { OneSignal } = await import('@onesignal/capacitor-plugin')
    await OneSignal.logout()
  } catch {}
}
