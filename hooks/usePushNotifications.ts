'use client'
import { useEffect } from 'react'
import { initOneSignal } from '@/lib/push'

export function usePushNotifications(userId?: string | null) {
  useEffect(() => {
    if (userId) initOneSignal(userId)
  }, [userId])
}
