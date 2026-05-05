import { format, isToday, isTomorrow, parseISO, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return `Aujourd'hui`
  if (isTomorrow(d)) return 'Demain'
  return format(d, 'd MMMM', { locale: fr })
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm')
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: fr })
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Couleur par index (pour les avatars)
const COLORS = ['#c8a96e', '#4a9fe8', '#3dba6f', '#e05a5a', '#9a6ee8', '#f97316']
export function colorFor(index: number): string {
  return COLORS[index % COLORS.length]
}

// Vérifie si le client a droit à un cadeau fidélité (10e visite)
export function isLoyaltyEligible(visitCount: number): boolean {
  return visitCount > 0 && visitCount % 10 === 0
}

// Format prix
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(0) + '€'
}

// Plan lisible
export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — 20€/mois',
  pro: 'Pro — 35€/mois',
}

// Status RDV lisible
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: 'amber' },
  confirmed: { label: 'Confirmé',   color: 'green' },
  completed: { label: 'Terminé',    color: 'gray' },
  cancelled: { label: 'Annulé',     color: 'red' },
  no_show:   { label: 'Absent',     color: 'red' },
  new:       { label: 'Nouveau ✦',  color: 'purple' },
}
