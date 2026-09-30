import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { attendanceApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { WeeklyChart } from '@/components/charts/WeeklyChart'
import { Badge, Button, Card, ErrorText, PageHeader, Spinner, Stat } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useCalendar, useNotifications, useTasks, useTodayAttendance } from '@/hooks/queries'
import { currentYearMonth, formatHours, formatMinutes, formatTime, monthLabel, personName, statusLabel } from '@/lib/format'
import { useAuth } from '@/state/AuthProvider'
import { useToast } from '@/state/ToastProvider'

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const now = currentYearMonth()
  const calendar = useCalendar(now.year, now.month)
  const attendance = useTodayAttendance()
  const tasks = useTasks('assigned')
  const notes = useNotifications(true)
  const toast = useToast()
  const client = useQueryClient()
  const punch = useMutation({
    mutationFn: (kind: 'in' | 'out') => (kind === 'in' ? attendanceApi.checkIn() : attendanceApi.checkOut()),
    onSuccess: async () => {
      toast.push('Attendance updated', 'success')
      await client.invalidateQueries({ queryKey: ['attendance-today'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })
  const sheet = calendar.data?.data
  const today = attendance.data?.data.attendance
  const missing = sheet?.days.filter((day) => day.isFillable && day.entryCount === 0).length ?? 0
  const openTasks = (tasks.data?.data ?? []).filter((task) => task.status !== 'done' && task.status !== 'cancelled').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={monthLabel(now.year, now.month)}
        title={`Good to see you, ${user?.firstName ?? 'there'}`}
        description="Today’s attendance, this month’s hours, and the work still open."
        actions={
          <Link to="/timesheet" className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Open timesheet
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Month hours" value={`${formatHours(sheet?.monthlyTotalMinutes ?? 0)}h`} hint={statusLabel(sheet?.timesheet?.status)} />
        <Stat label="Missing days" value={String(missing)} hint="Fillable days with no entry" />
        <Stat label="Open tasks" value={String(openTasks)} hint="Assigned to you" />
        <Stat label="Unread" value={String(notes.data?.meta?.unreadCount ?? notes.data?.data.length ?? 0)} hint="Notifications" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Attendance</p>
              <h2 className="mt-1 font-display text-3xl">{today ? statusLabel(today.status) : 'Not checked in'}</h2>
              <p className="mt-2 text-sm text-muted">
                {today ? `In ${formatTime(today.checkInAt)}${today.checkOutAt ? ` · Out ${formatTime(today.checkOutAt)}` : ''}` : 'Start the day when you arrive.'}
              </p>
              {today?.workMinutes != null ? <p className="mt-1 text-sm">{formatMinutes(today.workMinutes)} recorded</p> : null}
            </div>
            <Badge tone={statusTone(today?.status)}>{today ? statusLabel(today.status) : 'Away'}</Badge>
          </div>
          <div className="mt-5 flex gap-2">
            <Button disabled={punch.isPending || today?.status === 'checked_in' || today?.status === 'checked_out'} onClick={() => punch.mutate('in')}>
              Check in
            </Button>
            <Button variant="secondary" disabled={punch.isPending || today?.status !== 'checked_in'} onClick={() => punch.mutate('out')}>
              Check out
            </Button>
          </div>
          {punch.isError ? <div className="mt-3"><ErrorText message={errorMessage(punch.error)} /></div> : null}
        </Card>
        <WeeklyChart weeks={sheet?.weeklyTotals ?? []} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl">Open tasks</h2>
          <div className="mt-4 space-y-3">
            {(tasks.data?.data ?? []).slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted">{task.project.name ?? 'Project'}</p>
                </div>
                <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
              </div>
            ))}
            {(tasks.data?.data.length ?? 0) === 0 ? <p className="text-sm text-muted">Nothing assigned right now.</p> : null}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl">Notifications</h2>
          <div className="mt-4 space-y-3">
            {(notes.data?.data ?? []).slice(0, 4).map((item) => (
              <div key={item.id}>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">{item.message}</p>
              </div>
            ))}
            {(notes.data?.data.length ?? 0) === 0 ? <p className="text-sm text-muted">You’re caught up.</p> : null}
          </div>
        </Card>
      </div>
      {calendar.isLoading ? <Spinner label="Loading month" /> : null}
      <p className="text-sm text-muted">Signed in as {personName(user)}.</p>
    </div>
  )
}
