import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Card, ErrorText, PageHeader, SelectInput, Spinner, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { currentYearMonth, formatDate, formatHours, formatMinutes, monthRange, personName, statusLabel } from '@/lib/format'
import { WeeklyChart } from '@/components/charts/WeeklyChart'
import type { WeeklyTotal } from '@/types/api'

export function ReportsView({ showAudit }: { showAudit: boolean }) {
  const now = currentYearMonth()
  const [tab, setTab] = useState<'timesheets' | 'attendance' | 'leaves' | 'audit'>('timesheets')
  const [year, setYear] = useState(now.year)
  const [month, setMonth] = useState(now.month)
  const range = monthRange(year, month)
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)

  const timesheets = useQuery({
    queryKey: ['report-timesheets', year, month],
    queryFn: () => reportApi.timesheets({ year, month, limit: 100 }),
    enabled: tab === 'timesheets',
  })
  const attendance = useQuery({
    queryKey: ['report-attendance', from, to],
    queryFn: () => reportApi.attendance({ from, to, limit: 100 }),
    enabled: tab === 'attendance',
  })
  const leaves = useQuery({
    queryKey: ['report-leaves', year],
    queryFn: () => reportApi.leaves({ year, limit: 100 }),
    enabled: tab === 'leaves',
  })
  const audit = useQuery({
    queryKey: ['audit'],
    queryFn: () => reportApi.audit({ limit: 40 }),
    enabled: tab === 'audit' && showAudit,
  })

  const chart: WeeklyTotal[] = (timesheets.data?.data.rows ?? [])
    .flatMap((row) => row.weeklyTotals)
    .reduce<WeeklyTotal[]>((groups, week) => {
      const existing = groups.find((item) => item.weekStart === week.weekStart)
      if (existing) existing.totalMinutes += week.totalMinutes
      else groups.push({ ...week })
      return groups
    }, [])

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Insight" title="Reports" description="Figures come from the reporting API for the people you are allowed to see." />
      <div className="flex flex-wrap gap-2">
        {(['timesheets', 'attendance', 'leaves'] as const).map((item) => (
          <button key={item} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-ink text-canvas' : 'bg-card text-muted'}`} onClick={() => setTab(item)}>
            {statusLabel(item === 'timesheets' ? 'timesheets' : item)}
          </button>
        ))}
        {showAudit ? (
          <button className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'audit' ? 'bg-ink text-canvas' : 'bg-card text-muted'}`} onClick={() => setTab('audit')}>
            Audit
          </button>
        ) : null}
      </div>

      {tab === 'timesheets' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <TextInput className="w-28" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
            <SelectInput className="w-40" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(Date.UTC(2026, index, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })}
                </option>
              ))}
            </SelectInput>
          </div>
          <WeeklyChart weeks={chart} />
          {timesheets.isLoading ? <Spinner /> : null}
          {timesheets.isError ? <ErrorText message={errorMessage(timesheets.error)} /> : null}
          <div className="grid gap-3">
            {timesheets.data?.data.rows.map((row) => (
              <Card key={row.userId} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-sm text-muted">{row.employeeCode ?? row.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl">{formatHours(row.monthlyTotalMinutes)}h</p>
                  <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'attendance' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <TextInput className="w-44" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <TextInput className="w-44" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          {attendance.isLoading ? <Spinner /> : null}
          {attendance.isError ? <ErrorText message={errorMessage(attendance.error)} /> : null}
          <div className="grid gap-3">
            {attendance.data?.data.rows.map((row) => (
              <Card key={row.userId} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-sm text-muted">{row.daysPresent} days present</p>
                </div>
                <p className="font-display text-2xl">{formatMinutes(row.totalWorkMinutes)}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'leaves' ? (
        <div className="space-y-4">
          <TextInput className="w-28" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          {leaves.isLoading ? <Spinner /> : null}
          {leaves.isError ? <ErrorText message={errorMessage(leaves.error)} /> : null}
          <div className="grid gap-3">
            {leaves.data?.data.rows.map((row) => (
              <Card key={row.userId} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{row.name}</p>
                  <p className="font-display text-2xl">{row.approvedDays}d</p>
                </div>
                <p className="text-sm text-muted">
                  Pending {row.pendingDays} · Annual {row.byType.annual} · Sick {row.byType.sick} · Unpaid {row.byType.unpaid} · Other {row.byType.other}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'audit' && showAudit ? (
        <div className="space-y-3">
          {audit.isLoading ? <Spinner /> : null}
          {audit.isError ? <ErrorText message={errorMessage(audit.error)} /> : null}
          {audit.data?.data.map((row) => (
            <Card key={row.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{row.action}</p>
                <p className="text-sm text-muted">{formatDate(row.createdAt.slice(0, 10))}</p>
              </div>
              <p className="text-sm text-muted">
                {personName(row.actor)} · {row.entityType}
              </p>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
