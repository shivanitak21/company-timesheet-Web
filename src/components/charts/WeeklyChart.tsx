import type { WeeklyTotal } from '@/types/api'
import { formatHours } from '@/lib/format'
import { Card } from '@/components/ui/primitives'

export function WeeklyChart({ weeks }: { weeks: WeeklyTotal[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.totalMinutes))
  if (weeks.length === 0) {
    return (
      <Card className="px-5 py-8 text-sm text-muted">Weekly hours will chart here once the report returns time.</Card>
    )
  }
  return (
    <Card className="px-5 py-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Hours by week</p>
      <div className="mt-4 flex h-40 items-end gap-3">
        {weeks.map((week) => (
          <div key={week.weekStart} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs text-muted">{formatHours(week.totalMinutes)}</span>
            <div className="flex h-28 w-full items-end rounded-2xl bg-canvas">
              <div className="w-full rounded-2xl bg-accent" style={{ height: `${Math.max(8, (week.totalMinutes / max) * 100)}%` }} />
            </div>
            <span className="text-[11px] text-muted">{week.weekStart.slice(5)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
