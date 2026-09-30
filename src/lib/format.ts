import type { LockReason } from '@/types/api'

const LOCK_COPY: Record<LockReason, string> = {
  weekend: 'Weekends are not fillable.',
  holiday: 'Company holidays are not fillable.',
  leave: 'Approved leave dates are not fillable.',
  future: 'Future dates cannot be filled.',
  previous_month: 'Previous months are locked.',
  pending_approval: 'Submitted timesheets are pending approval and cannot be edited.',
  approved: 'Approved timesheets are locked.',
}

export function lockMessage(reasons: readonly LockReason[]): string {
  if (reasons.length === 0) return 'This date cannot be filled.'
  return reasons.map((reason) => LOCK_COPY[reason]).join(' ')
}

export function formatMinutes(minutes: number): string {
  const abs = Math.abs(Math.round(minutes))
  const hours = Math.floor(abs / 60)
  const rest = abs % 60
  const sign = minutes < 0 ? '-' : ''
  if (hours === 0) return `${sign}${rest}m`
  if (rest === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${rest}m`
}

export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1)
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

type Named = {
  firstName?: string
  lastName?: string
  email?: string
  name?: string
} | null | undefined

export function personName(person: Named): string {
  if (!person) return 'Unknown'
  if (person.name) return person.name
  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim()
  return name || person.email || 'Unknown'
}

export function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function currentYearMonth(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

export function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from: start, to: end }
}

export function previewDuration(start: string, end: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) return null
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  return minutes > 0 ? minutes : null
}

export function statusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    cancelled: 'Cancelled',
    checked_in: 'Checked in',
    checked_out: 'Checked out',
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
    active: 'Active',
    archived: 'Archived',
    full_time: 'Full time',
    part_time: 'Part time',
    contract: 'Contract',
    annual: 'Annual',
    sick: 'Sick',
    unpaid: 'Unpaid',
    other: 'Other',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    employee: 'Employee',
    manager: 'Manager',
    admin: 'Admin',
  }
  if (!status) return 'Not started'
  return labels[status] ?? status.split('_').join(' ')
}

export function todayIso(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
