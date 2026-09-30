import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { leaveApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, EmptyState, ErrorText, Field, PageHeader, SelectInput, Spinner, TextArea, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useLeaves, usePendingLeaves } from '@/hooks/queries'
import { formatDate, personName, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import type { LeaveStatus } from '@/types/api'
import { leaveSchema, rejectSchema, type LeaveValues } from '@/validation/schemas'

export function LeaveBoard({ mode }: { mode: 'self' | 'review' }) {
  const [status, setStatus] = useState<LeaveStatus | ''>('')
  const leaves = useLeaves(status || undefined)
  const pending = usePendingLeaves()
  const toast = useToast()
  const client = useQueryClient()

  async function refresh() {
    await client.invalidateQueries({ predicate: (query) => ['leaves', 'pending-leaves', 'calendar'].includes(String(query.queryKey[0])) })
  }

  const decide = useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject' | 'cancel'; reason?: string }) => {
      if (input.action === 'approve') return leaveApi.approve(input.id)
      if (input.action === 'cancel') return leaveApi.cancel(input.id)
      return leaveApi.reject(input.id, input.reason ?? '')
    },
    onSuccess: async () => {
      toast.push('Leave updated', 'success')
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time away"
        title={mode === 'self' ? 'Leave' : 'Leave requests'}
        description={mode === 'self' ? 'Request time away. Approved dates are blocked on your timesheet by the API.' : 'Review requests from your team. Approval locks those dates on the timesheet.'}
      />
      {mode === 'self' ? <LeaveRequest onCreated={refresh} /> : null}
      {mode === 'review' ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Pending</h2>
          {pending.isLoading ? <Spinner /> : null}
          {(pending.data?.data.length ?? 0) === 0 && !pending.isLoading ? <EmptyState title="Nothing waiting" body="New leave requests will land here." /> : null}
          {pending.data?.data.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} onDecide={(action, reason) => decide.mutate({ id: leave.id, action, reason })} />
          ))}
        </section>
      ) : null}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{mode === 'self' ? 'Your requests' : 'All requests'}</h2>
          <SelectInput className="w-40" value={status} onChange={(event) => setStatus(event.target.value as LeaveStatus | '')}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </SelectInput>
        </div>
        {leaves.isLoading ? <Spinner /> : null}
        {leaves.isError ? <ErrorText message={errorMessage(leaves.error)} /> : null}
        {(leaves.data?.data.length ?? 0) === 0 && !leaves.isLoading ? <EmptyState title="No leave yet" body="Requests you can see will be listed here." /> : null}
        {leaves.data?.data.map((leave) => (
          <Card key={leave.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{personName(leave.user)}</p>
                  <Badge tone={statusTone(leave.status)}>{statusLabel(leave.status)}</Badge>
                  <Badge>{statusLabel(leave.type)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.dayCount} working day{leave.dayCount === 1 ? '' : 's'}
                </p>
                <p className="mt-2 text-sm">{leave.reason}</p>
                {leave.rejectionReason ? <p className="mt-2 text-sm text-danger">{leave.rejectionReason}</p> : null}
              </div>
              {mode === 'self' && leave.status === 'pending' ? (
                <Button variant="secondary" onClick={() => decide.mutate({ id: leave.id, action: 'cancel' })}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}

function LeaveRequest({ onCreated }: { onCreated: () => Promise<void> }) {
  const form = useForm<LeaveValues>({ resolver: zodResolver(leaveSchema), defaultValues: { type: 'annual', startDate: '', endDate: '', reason: '' } })
  const create = useMutation({
    mutationFn: leaveApi.create,
    onSuccess: async () => {
      form.reset()
      await onCreated()
    },
  })
  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl">Request leave</h2>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
        <Field label="Type" error={form.formState.errors.type?.message}>
          <SelectInput {...form.register('type')}>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </SelectInput>
        </Field>
        <div />
        <Field label="Start" error={form.formState.errors.startDate?.message}>
          <TextInput type="date" {...form.register('startDate')} />
        </Field>
        <Field label="End" error={form.formState.errors.endDate?.message}>
          <TextInput type="date" {...form.register('endDate')} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <TextArea {...form.register('reason')} />
          </Field>
        </div>
        <div className="md:col-span-2 space-y-2">
          <ErrorText message={create.error ? errorMessage(create.error) : create.isSuccess ? null : null} />
          {create.isSuccess ? <p className="text-sm text-accent">Request sent.</p> : null}
          <Button type="submit" disabled={create.isPending}>
            Submit request
          </Button>
        </div>
      </form>
    </Card>
  )
}

function LeaveCard({
  leave,
  onDecide,
}: {
  leave: { id: string; user: { firstName?: string; lastName?: string; email?: string }; type: string; startDate: string; endDate: string; dayCount: number; reason: string }
  onDecide: (action: 'approve' | 'reject', reason?: string) => void
}) {
  const form = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })
  const [rejecting, setRejecting] = useState(false)
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{personName(leave.user)}</p>
          <p className="text-sm text-muted">
            {statusLabel(leave.type)} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.dayCount} days
          </p>
          <p className="mt-2 text-sm">{leave.reason}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onDecide('approve')}>Approve</Button>
          <Button variant="secondary" onClick={() => setRejecting((value) => !value)}>
            Reject
          </Button>
        </div>
      </div>
      {rejecting ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={form.handleSubmit((values) => {
            onDecide('reject', values.reason)
            setRejecting(false)
          })}
        >
          <TextInput placeholder="Reason" {...form.register('reason')} />
          <Button type="submit" variant="danger">
            Confirm reject
          </Button>
        </form>
      ) : null}
      {form.formState.errors.reason ? <p className="mt-2 text-xs text-danger">{form.formState.errors.reason.message}</p> : null}
    </Card>
  )
}
