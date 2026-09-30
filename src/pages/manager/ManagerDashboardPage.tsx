import { Link } from 'react-router-dom'
import { WeeklyChart } from '@/components/charts/WeeklyChart'
import { PageHeader, Spinner, Stat } from '@/components/ui/primitives'
import { useEmployees, usePendingLeaves, usePendingTimesheets } from '@/hooks/queries'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/api/resources'
import { currentYearMonth, formatHours, monthLabel } from '@/lib/format'

export function ManagerDashboardPage() {
  const now = currentYearMonth()
  const team = useEmployees()
  const timesheets = usePendingTimesheets()
  const leaves = usePendingLeaves()
  const report = useQuery({
    queryKey: ['report-timesheets', now.year, now.month, 'dash'],
    queryFn: () => reportApi.timesheets({ year: now.year, month: now.month, limit: 100 }),
  })
  const hours = (report.data?.data.rows ?? []).reduce((sum, row) => sum + row.monthlyTotalMinutes, 0)
  const weeks = (report.data?.data.rows ?? []).flatMap((row) => row.weeklyTotals).reduce<{ weekStart: string; weekEnd: string; totalMinutes: number }[]>((groups, week) => {
    const found = groups.find((item) => item.weekStart === week.weekStart)
    if (found) found.totalMinutes += week.totalMinutes
    else groups.push({ ...week })
    return groups
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={monthLabel(now.year, now.month)}
        title="Team overview"
        description="Approvals waiting on you, and hours already logged across the people you can see."
        actions={
          <Link to="/manager/approvals" className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Review approvals
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="People" value={String(team.data?.meta?.total ?? team.data?.data.length ?? 0)} hint="In your directory" />
        <Stat label="Timesheets" value={String(timesheets.data?.meta?.total ?? timesheets.data?.data.length ?? 0)} hint="Pending approval" />
        <Stat label="Leave" value={String(leaves.data?.meta?.total ?? leaves.data?.data.length ?? 0)} hint="Pending requests" />
        <Stat label="Logged" value={`${formatHours(hours)}h`} hint="This month" />
      </div>
      {report.isLoading ? <Spinner /> : <WeeklyChart weeks={weeks} />}
    </div>
  )
}
