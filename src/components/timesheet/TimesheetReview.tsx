import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { EntryDrawer } from '@/components/timesheet/EntryDrawer'
import { MonthCalendar } from '@/components/timesheet/MonthCalendar'
import { Badge, Button, Card, EmptyState, ErrorText, PageHeader, SelectInput, Spinner, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useCalendar, useEmployees, usePendingTimesheets } from '@/hooks/queries'
import { currentYearMonth, formatHours, monthLabel, personName, shiftMonth, statusLabel } from '@/lib/format'
import { useAuth } from '@/state/AuthProvider'
import { useToast } from '@/state/ToastProvider'
import type { CalendarDay } from '@/types/api'
import { rejectSchema } from '@/validation/schemas'

export function TimesheetReview() {
  const { user } = useAuth()
  const toast = useToast()
  const client = useQueryClient()
  const pending = usePendingTimesheets()
  const people = useEmployees()
  const [cursor, setCursor] = useState(currentYearMonth())
  const [userId, setUserId] = useState<string>('')
  const [selected, setSelected] = useState<CalendarDay | null>(null)
  const calendar = useCalendar(cursor.year, cursor.month, userId || undefined)
  const viewingSelf = !userId || userId === user?.id

  async function refresh() {
    await client.invalidateQueries({ predicate: (query) => ['pending-timesheets', 'calendar', 'report-timesheets'].includes(String(query.queryKey[0])) })
  }

  const decide = useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      input.action === 'approve' ? timesheetApi.approve(input.id) : timesheetApi.reject(input.id, input.reason ?? ''),
    onSuccess: async () => {
      toast.push('Timesheet updated', 'success')
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title="Timesheets"
        description="Approve submitted months, or open a person’s calendar. Entries stay read-only unless you are looking at your own fillable days."
      />
      {pending.isLoading ? <Spinner /> : null}
      {pending.isError ? <ErrorText message={errorMessage(pending.error)} /> : null}
      {(pending.data?.data.length ?? 0) === 0 && !pending.isLoading ? <EmptyState title="No submissions waiting" body="Submitted timesheets from your team appear here." /> : null}
      <div className="grid gap-3">
        {pending.data?.data.map((sheet) => (
          <PendingCard
            key={sheet.id}
            name={personName(sheet.employee)}
            detail={`${monthLabel(sheet.year, sheet.month)} · ${formatHours(sheet.totalMinutes)}h`}
            onApprove={() => decide.mutate({ id: sheet.id, action: 'approve' })}
            onReject={(reason) => decide.mutate({ id: sheet.id, action: 'reject', reason })}
            onOpen={() => {
              if (sheet.employee?.id) setUserId(sheet.employee.id)
              setCursor({ year: sheet.year, month: sheet.month })
            }}
          />
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <SelectInput className="sm:max-w-xs" value={userId} onChange={(event) => { setUserId(event.target.value); setSelected(null) }}>
          <option value="">My calendar</option>
          {people.data?.data.map((person) => (
            <option key={person.user?.id} value={person.user?.id}>
              {personName(person.user)} · {person.department}
            </option>
          ))}
        </SelectInput>
        <Badge tone={viewingSelf ? 'good' : 'info'}>{viewingSelf ? 'You can edit fillable days' : 'Read only'}</Badge>
      </Card>
      <MonthCalendar
        year={cursor.year}
        month={cursor.month}
        data={calendar.data?.data}
        isLoading={calendar.isLoading}
        selectedDate={selected?.date ?? null}
        onMonthChange={(delta) => {
          setCursor((current) => shiftMonth(current.year, current.month, delta))
          setSelected(null)
        }}
        onSelect={setSelected}
      />
      <EntryDrawer
        day={selected}
        userId={userId || undefined}
        allowWrite={viewingSelf}
        weeklyTotals={calendar.data?.data.weeklyTotals ?? []}
        monthlyTotalMinutes={calendar.data?.data.monthlyTotalMinutes ?? 0}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function PendingCard({
  name,
  detail,
  onApprove,
  onReject,
  onOpen,
}: {
  name: string
  detail: string
  onApprove: () => void
  onReject: (reason: string) => void
  onOpen: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{name}</p>
            <Badge tone={statusTone('submitted')}>{statusLabel('submitted')}</Badge>
          </div>
          <p className="text-sm text-muted">{detail}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onOpen}>
            Open
          </Button>
          <Button onClick={onApprove}>Approve</Button>
          <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
            Reject
          </Button>
        </div>
      </div>
      {open ? (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={form.handleSubmit((values) => onReject(values.reason))}>
          <TextInput placeholder="Reason for rejection" {...form.register('reason')} />
          <Button type="submit" variant="danger">
            Confirm
          </Button>
        </form>
      ) : null}
    </Card>
  )
}
