import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { leaveApi, timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, EmptyState, ErrorText, PageHeader, Spinner, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { usePendingLeaves, usePendingTimesheets } from '@/hooks/queries'
import { formatDate, formatHours, monthLabel, personName, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import { rejectSchema } from '@/validation/schemas'

export function ApprovalsPage() {
  const sheets = usePendingTimesheets()
  const leaves = usePendingLeaves()
  const toast = useToast()
  const client = useQueryClient()
  const act = useMutation({
    mutationFn: async (input: { kind: 'timesheet' | 'leave'; id: string; action: 'approve' | 'reject'; reason?: string }) => {
      if (input.kind === 'timesheet') {
        return input.action === 'approve' ? timesheetApi.approve(input.id) : timesheetApi.reject(input.id, input.reason ?? '')
      }
      return input.action === 'approve' ? leaveApi.approve(input.id) : leaveApi.reject(input.id, input.reason ?? '')
    },
    onSuccess: async () => {
      toast.push('Decision saved', 'success')
      await client.invalidateQueries({ predicate: (query) => ['pending-timesheets', 'pending-leaves', 'leaves', 'calendar'].includes(String(query.queryKey[0])) })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Queue" title="Approvals" description="Timesheets and leave waiting for a decision. The API applies the lock once you approve." />
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Timesheets</h2>
        {sheets.isLoading ? <Spinner /> : null}
        {sheets.isError ? <ErrorText message={errorMessage(sheets.error)} /> : null}
        {(sheets.data?.data.length ?? 0) === 0 && !sheets.isLoading ? <EmptyState title="No timesheets" body="Submitted months will queue here." /> : null}
        {sheets.data?.data.map((sheet) => (
          <DecisionCard
            key={sheet.id}
            title={personName(sheet.employee)}
            meta={`${monthLabel(sheet.year, sheet.month)} · ${formatHours(sheet.totalMinutes)}h`}
            onApprove={() => act.mutate({ kind: 'timesheet', id: sheet.id, action: 'approve' })}
            onReject={(reason) => act.mutate({ kind: 'timesheet', id: sheet.id, action: 'reject', reason })}
          />
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Leave</h2>
        {leaves.isLoading ? <Spinner /> : null}
        {(leaves.data?.data.length ?? 0) === 0 && !leaves.isLoading ? <EmptyState title="No leave" body="Pending requests will queue here." /> : null}
        {leaves.data?.data.map((leave) => (
          <DecisionCard
            key={leave.id}
            title={`${personName(leave.user)} · ${statusLabel(leave.type)}`}
            meta={`${formatDate(leave.startDate)} – ${formatDate(leave.endDate)} · ${leave.dayCount} days`}
            note={leave.reason}
            onApprove={() => act.mutate({ kind: 'leave', id: leave.id, action: 'approve' })}
            onReject={(reason) => act.mutate({ kind: 'leave', id: leave.id, action: 'reject', reason })}
          />
        ))}
      </section>
    </div>
  )
}

function DecisionCard({
  title,
  meta,
  note,
  onApprove,
  onReject,
}: {
  title: string
  meta: string
  note?: string
  onApprove: () => void
  onReject: (reason: string) => void
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{title}</p>
            <Badge tone={statusTone('pending')}>Pending</Badge>
          </div>
          <p className="text-sm text-muted">{meta}</p>
          {note ? <p className="mt-2 text-sm">{note}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button onClick={onApprove}>Approve</Button>
          <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
            Reject
          </Button>
        </div>
      </div>
      {open ? (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={form.handleSubmit((values) => onReject(values.reason))}>
          <TextInput placeholder="Reason" {...form.register('reason')} />
          <Button variant="danger" type="submit">
            Confirm
          </Button>
        </form>
      ) : null}
    </Card>
  )
}
