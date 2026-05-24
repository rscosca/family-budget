const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

const euroFormatterNoCents = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEur(cents: number): string {
  return euroFormatter.format(cents / 100)
}

export function formatEurCompact(cents: number): string {
  return euroFormatterNoCents.format(cents / 100)
}

const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
})

const monthFormatter = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric',
})

export function formatDayLabel(isoDate: string, today: Date = new Date()): string {
  const date = new Date(`${isoDate}T00:00:00`)
  const diff = Math.round((startOfDay(today).getTime() - startOfDay(date).getTime()) / 86_400_000)
  if (diff === 0) return `Hoy, ${dayFormatter.format(date)}`
  if (diff === 1) return `Ayer, ${dayFormatter.format(date)}`
  return capitalize(dayFormatter.format(date))
}

export function formatMonth(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return capitalize(monthFormatter.format(date))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = (day + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
}
