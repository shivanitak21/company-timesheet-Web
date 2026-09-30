import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { holidayApi, reportApi } from '@/api/resources'
import { PageHeader, Stat } from '@/components/ui/primitives'
import { useEmployees, usePendingLeaves, usePendingTimesheets } from '@/hooks/queries'
import { currentYearMonth, formatHours } from '@/lib/format'

export function AdminDashboardPage() {
  const now = currentYearMonth()
  const people = useEmployees()
  const sheets = usePendingTimesheets()
  const leaves = usePendingLeaves()
  const holidays = useQuery({ queryKey: ['holidays', now.year, 'dash'], queryFn: () => holidayApi.list(now.year) })
  const report = useQuery({
    queryKey: ['report-timesheets', now.year, now.month, 'admin'],
    queryFn: () => reportApi.timesheets({ year: now.year, month: now.month, limit: 100 }),
  })
  const hours = (report.data?.data.rows ?? []).reduce((sum, row) => sum + row.monthlyTotalMinutes, 0)
  const departments = new Set((people.data?.data ?? []).map((person) => person.department)).size

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Admin"
        description="Directory, calendars, and approvals across the company. Rules for filling time stay on the API."
        actions={
          <Link to="/admin/employees" className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Manage people
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Profiles" value={String(people.data?.meta?.total ?? 0)} hint={`${departments} departments on this page`} />
        <Stat label="Timesheets" value={String(sheets.data?.meta?.total ?? 0)} hint="Waiting for approval" />
        <Stat label="Leave" value={String(leaves.data?.meta?.total ?? 0)} hint="Waiting for approval" />
        <Stat label="Logged" value={`${formatHours(hours)}h`} hint={`${holidays.data?.data.rows.length ?? 0} holidays this year`} />
      </div>
    </div>
  )
}
