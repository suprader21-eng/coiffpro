// Client-side OneSignal initialization — Capacitor native (iOS/Android) only.
// Dynamically imported so Next.js SSR is not affected.

export async function initOneSignal(externalId: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const OSModule = await import('@onesignal/capacitor-plugin')
    const OS = (OSModule as any).OneSignal ?? (OSModule as any).default ?? OSModule
    OS.initialize(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!)
    await OS.Notifications?.requestPermission(true)
    await OS.login(externalId)
  } catch {}
}

export async function logoutOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const OSModule = await import('@onesignal/capacitor-plugin')
    const OS = (OSModule as any).OneSignal ?? (OSModule as any).default ?? OSModule
    await OS.logout()
  } catch {}
}
