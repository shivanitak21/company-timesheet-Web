import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { EntryDrawer } from '@/components/timesheet/EntryDrawer'
import { MonthCalendar } from '@/components/timesheet/MonthCalendar'
import { Button, ErrorText, PageHeader } from '@/components/ui/primitives'
import { useCalendar } from '@/hooks/queries'
import { currentYearMonth, lockMessage, shiftMonth } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import type { CalendarDay } from '@/types/api'

export function TimesheetPage() {
  const [cursor, setCursor] = useState(currentYearMonth)
  const [selected, setSelected] = useState<CalendarDay | null>(null)
  const calendar = useCalendar(cursor.year, cursor.month)
  const toast = useToast()
  const client = useQueryClient()
  const data = calendar.data?.data
  const submit = useMutation({
    mutationFn: (id: string) => timesheetApi.submit(id),
    onSuccess: async () => {
      toast.push('Submitted for approval', 'success')
      await client.invalidateQueries({ predicate: (query) => ['calendar', 'daily'].includes(String(query.queryKey[0])) })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })
  const canSubmit = data?.timesheet && (data.timesheet.status === 'draft' || data.timesheet.status === 'rejected')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Time"
        title="Timesheet"
        description="Only current-month working days can be filled. Weekends, holidays, approved leave, future dates, and locked months follow the API."
        actions={
          <Button disabled={!canSubmit || submit.isPending} onClick={() => data?.timesheet && submit.mutate(data.timesheet.id)}>
            Submit for approval
          </Button>
        }
      />
      {calendar.isError ? <ErrorText message={errorMessage(calendar.error)} /> : null}
      {data?.timesheet?.rejectionReason ? <ErrorText message={data.timesheet.rejectionReason} /> : null}
      <MonthCalendar
        year={cursor.year}
        month={cursor.month}
        data={data}
        isLoading={calendar.isLoading}
        selectedDate={selected?.date ?? null}
        onMonthChange={(delta) => {
          setCursor((current) => shiftMonth(current.year, current.month, delta))
          setSelected(null)
        }}
        onSelect={(day) => {
          const quiet = (day.isWeekend || day.isHoliday || day.isOnLeave || day.isFuture) && day.entryCount === 0
          if (quiet) {
            toast.push(lockMessage(day.lockReasons), 'info')
            return
          }
          setSelected(day)
        }}
      />
      <EntryDrawer
        day={selected}
        allowWrite
        weeklyTotals={data?.weeklyTotals ?? []}
        monthlyTotalMinutes={data?.monthlyTotalMinutes ?? 0}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
