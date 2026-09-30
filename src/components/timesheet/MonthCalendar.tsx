import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives'
import { formatHours, formatMinutes, monthLabel, statusLabel } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CalendarDay, MonthCalendar as MonthCalendarData, TimesheetStatus } from '@/types/api'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dayTone(day: CalendarDay, status: TimesheetStatus | null) {
  if (day.isHoliday) return 'holiday'
  if (day.isOnLeave) return 'leave'
  if (day.isWeekend) return 'weekend'
  if (day.isFuture) return 'future'
  if (day.isFillable && day.entryCount === 0) return 'missing'
  if (status === 'approved') return 'approved'
  if (status === 'submitted') return 'pending'
  if (status === 'rejected') return 'rejected'
  if (day.entryCount > 0) return 'filled'
  return 'plain'
}

export function MonthCalendar({
  year,
  month,
  data,
  isLoading,
  selectedDate,
  onMonthChange,
  onSelect,
}: {
  year: number
  month: number
  data?: MonthCalendarData
  isLoading: boolean
  selectedDate: string | null
  onMonthChange: (delta: number) => void
  onSelect: (day: CalendarDay) => void
}) {
  const status = data?.timesheet?.status ?? null
  const lead = data?.days[0] ? (data.days[0].weekday + 6) % 7 : 0
  const missing = data?.days.filter((day) => day.isFillable && day.entryCount === 0).length ?? 0

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">Monthly calendar</p>
          <h2 className="font-display text-3xl">{monthLabel(year, month)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status ? <Badge tone={status === 'approved' ? 'good' : status === 'rejected' ? 'bad' : status === 'submitted' ? 'pending' : 'neutral'}>{statusLabel(status)}</Badge> : <Badge>Not started</Badge>}
          <Badge tone={missing > 0 ? 'pending' : 'good'}>{missing} missing</Badge>
          <div className="flex items-center rounded-full border border-line">
            <Button variant="ghost" className="rounded-full" onClick={() => onMonthChange(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => onMonthChange(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-4">
        <Mini label="Month" value={formatHours(data?.monthlyTotalMinutes ?? 0)} suffix="h" />
        {(data?.weeklyTotals ?? []).slice(0, 3).map((week) => (
          <Mini key={week.weekStart} label={`Week of ${week.weekStart.slice(8)}`} value={formatHours(week.totalMinutes)} suffix="h" />
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-line text-center text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-3">
            {day}
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="px-5 py-16">
          <Spinner label="Loading calendar" />
        </div>
      ) : (
        <div className="grid grid-cols-7 border-t border-line">
          {Array.from({ length: lead }).map((_, index) => (
            <div key={`pad-${index}`} className="min-h-28 border-r border-b border-line bg-ink/2" />
          ))}
          {data?.days.map((day) => {
            const tone = dayTone(day, status)
            const blockedQuiet = (day.isWeekend || day.isHoliday || day.isOnLeave || day.isFuture) && day.entryCount === 0
            return (
              <button
                key={day.date}
                type="button"
                disabled={blockedQuiet}
                onClick={() => onSelect(day)}
                className={cn(
                  'relative min-h-28 border-r border-b border-line p-2 text-left transition sm:min-h-32 sm:p-3',
                  selectedDate === day.date && 'ring-2 ring-accent ring-inset',
                  data.today === day.date && 'bg-accent-soft/70',
                  tone === 'weekend' && 'bg-ink/4 text-muted',
                  tone === 'holiday' && 'bg-violet-500/10',
                  tone === 'leave' && 'bg-sky-500/10',
                  tone === 'future' && 'opacity-45',
                  tone === 'missing' && 'bg-gold/8',
                  tone === 'approved' && 'bg-accent-soft/80',
                  tone === 'pending' && 'bg-gold/10',
                  tone === 'rejected' && 'bg-danger/8',
                  blockedQuiet ? 'cursor-not-allowed' : 'hover:bg-ink/4',
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={cn('text-sm font-semibold', data.today === day.date && 'text-accent')}>{Number(day.date.slice(8))}</span>
                  {day.entryCount > 0 ? <span className="font-display text-sm">{formatHours(day.totalMinutes)}</span> : null}
                </div>
                <div className="mt-2 space-y-1">
                  {day.isHoliday ? <p className="line-clamp-2 text-[11px] font-medium text-violet-800 dark:text-violet-200">{day.holidayName}</p> : null}
                  {day.isOnLeave ? <p className="text-[11px] font-medium text-sky-800 dark:text-sky-200">Leave</p> : null}
                  {day.isWeekend ? <p className="text-[11px] text-muted">Weekend</p> : null}
                  {tone === 'missing' ? <p className="text-[11px] font-semibold text-gold">Missing</p> : null}
                  {day.entryCount > 0 && status ? <p className="text-[11px] text-muted">{statusLabel(status)}</p> : null}
                  {day.totalMinutes > 0 ? <p className="text-[11px] text-muted">{formatMinutes(day.totalMinutes)}</p> : null}
                </div>
              </button>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-2 px-5 py-4 text-xs text-muted">
        <Legend swatch="bg-gold/30" label="Missing" />
        <Legend swatch="bg-gold/50" label="Pending approval" />
        <Legend swatch="bg-accent/40" label="Approved" />
        <Legend swatch="bg-danger/40" label="Rejected" />
        <Legend swatch="bg-violet-400/60" label="Holiday" />
        <Legend swatch="bg-sky-400/60" label="Approved leave" />
        <Legend swatch="bg-ink/20" label="Weekend" />
      </div>
    </Card>
  )
}

function Mini({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display text-2xl">
        {value}
        <span className="ml-1 text-sm text-muted">{suffix}</span>
      </p>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', swatch)} />
      {label}
    </span>
  )
}
