import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: es })
}

export function daysSince(dateString: string): number {
  return differenceInDays(new Date(), parseISO(dateString))
}

export function urgencyLevel(
  lastExecution: string | null,
  intervalDays: number | null
): 'none' | 'ok' | 'warning' | 'overdue' {
  if (!lastExecution) return 'none'
  if (!intervalDays) return 'ok'

  const days = daysSince(lastExecution)
  const ratio = days / intervalDays

  if (ratio < 0.75) return 'ok'
  if (ratio < 1.0) return 'warning'
  return 'overdue'
}

export function formatInterval(days: number): string {
  if (days === 1) return 'cada día'
  if (days < 7) return `cada ${days} días`
  if (days === 7) return 'cada semana'
  if (days < 30) return `cada ${Math.round(days / 7)} semanas`
  if (days < 365) return `cada ${Math.round(days / 30)} meses`
  return `cada ${Math.round(days / 365)} años`
}
