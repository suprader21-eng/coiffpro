// ============================================================
// CoiffPro — Couche d'abstraction des notifications
// Permet de changer de canal (SMS, Push, Email) sans toucher
// au code métier. Actuellement : SMS via Android Gateway.
// ============================================================

import {
  sendConfirmation as smsSendConfirmation,
  sendReminder as smsSendReminder,
  sendReviewRequest as smsSendReviewRequest,
  sendLoyaltyReward as smsSendLoyaltyReward,
  sendReactivation as smsSendReactivation,
  sendCampaign as smsSendCampaign,
} from './sms'

export type NotifyResult =
  | { success: true; channel: string; messageId?: string }
  | { success: false; channel: string; error: string }

// ── Paramètres communs ──────────────────────────────────────

export type ConfirmationParams = {
  clientName: string; clientPhone: string
  serviceName: string; date: string; time: string
  salonName: string; salonPhone?: string
}

export type ReminderParams = ConfirmationParams

export type ReviewParams = {
  clientName: string; clientPhone: string
  salonName: string; googleLink: string
}

export type LoyaltyParams = {
  clientName: string; clientPhone: string
  salonName: string; reward?: string
}

export type ReactivationParams = {
  clientName: string; clientPhone: string
  salonName: string; bookingUrl: string; weeksSince: number
}

export type CampaignParams = {
  clients: { name: string; phone: string }[]
  message: string; salonName: string
}

// ── Fonctions publiques ─────────────────────────────────────
// Chaque fonction essaie le canal principal (SMS) et peut être
// étendue pour tenter un canal Push en fallback.

function wrap(r: { success: boolean; messageId?: string; error?: string }, channel = 'sms'): NotifyResult {
  return r.success
    ? { success: true, channel, messageId: r.messageId }
    : { success: false, channel, error: (r as any).error || 'Erreur inconnue' }
}

export async function notifyConfirmation(p: ConfirmationParams): Promise<NotifyResult> {
  return wrap(await smsSendConfirmation(p))
}

export async function notifyReminder(p: ReminderParams): Promise<NotifyResult> {
  return wrap(await smsSendReminder(p))
}

export async function notifyReviewRequest(p: ReviewParams): Promise<NotifyResult> {
  return wrap(await smsSendReviewRequest(p))
}

export async function notifyLoyalty(p: LoyaltyParams): Promise<NotifyResult> {
  return wrap(await smsSendLoyaltyReward(p))
}

export async function notifyReactivation(p: ReactivationParams): Promise<NotifyResult> {
  return wrap(await smsSendReactivation(p))
}

export async function notifyCampaign(p: CampaignParams) {
  return smsSendCampaign(p)
}
