import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Drawer, ErrorText, Field, SelectInput, Spinner, TextArea, TextInput } from '@/components/ui/primitives'
import { useDaily, useProjects, useTasks } from '@/hooks/queries'
import { formatDate, formatMinutes, lockMessage, previewDuration, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import type { CalendarDay, EntryPayload, TimeEntry, WeeklyTotal } from '@/types/api'
import { entrySchema, type EntryValues } from '@/validation/schemas'

const emptyForm: EntryValues = {
  workType: 'assigned',
  taskId: '',
  projectId: '',
  startTime: '09:00',
  endTime: '17:00',
  description: '',
}

export function EntryDrawer({
  day,
  userId,
  allowWrite,
  weeklyTotals,
  monthlyTotalMinutes,
  onClose,
}: {
  day: CalendarDay | null
  userId?: string
  allowWrite: boolean
  weeklyTotals: WeeklyTotal[]
  monthlyTotalMinutes: number
  onClose: () => void
}) {
  const toast = useToast()
  const client = useQueryClient()
  const daily = useDaily(day?.date ?? null, userId)
  const tasks = useTasks('assigned')
  const projects = useProjects('active')
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const form = useForm<EntryValues>({ resolver: zodResolver(entrySchema), defaultValues: emptyForm })
  const startTime = form.watch('startTime')
  const endTime = form.watch('endTime')
  const workType = form.watch('workType')
  const duration = previewDuration(startTime, endTime)
  const editable = allowWrite && Boolean(daily.data?.data.isFillable)
  const week = weeklyTotals.find((item) => day && item.weekStart <= day.date && day.date <= item.weekEnd)

  const reset = form.reset
  useEffect(() => {
    setEditing(null)
    reset(emptyForm)
  }, [day?.date, reset])

  function invalidate() {
    void client.invalidateQueries({ predicate: (query) => ['calendar', 'daily'].includes(String(query.queryKey[0])) })
  }

  const save = useMutation({
    mutationFn: (body: EntryPayload) => (editing ? timesheetApi.updateEntry(editing.id, body) : timesheetApi.createEntry(body)),
    onSuccess: () => {
      toast.push(editing ? 'Entry updated' : 'Entry saved', 'success')
      setEditing(null)
      form.reset(emptyForm)
      invalidate()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const remove = useMutation({
    mutationFn: (entryId: string) => timesheetApi.deleteEntry(entryId),
    onSuccess: () => {
      toast.push('Entry deleted', 'success')
      setEditing(null)
      form.reset(emptyForm)
      invalidate()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  function onSubmit(values: EntryValues) {
    if (!day) return
    const shared = {
      date: day.date,
      startTime: values.startTime,
      endTime: values.endTime,
      description: values.description.trim(),
    }
    const body: EntryPayload =
      values.workType === 'assigned'
        ? { workType: 'assigned', taskId: values.taskId ?? '', ...shared }
        : { workType: 'unassigned', ...shared, ...(values.projectId ? { projectId: values.projectId } : {}) }
    save.mutate(body)
  }

  function beginEdit(entry: TimeEntry) {
    setEditing(entry)
    form.reset({
      workType: entry.workType,
      taskId: entry.task?.id ?? '',
      projectId: entry.project?.id ?? '',
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
    })
  }

  const lock = daily.data?.data.lockReasons ?? day?.lockReasons ?? []

  return (
    <Drawer
      open={Boolean(day)}
      onClose={onClose}
      title={day ? formatDate(day.date) : 'Day'}
      subtitle={editable ? 'Add or revise time for this working day.' : lockMessage(lock)}
    >
      {!day ? null : daily.isLoading ? (
        <Spinner label="Loading entries" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Total label="Day" value={formatMinutes(daily.data?.data.totalMinutes ?? day.totalMinutes)} />
            <Total label="Week" value={formatMinutes(week?.totalMinutes ?? 0)} />
            <Total label="Month" value={formatMinutes(monthlyTotalMinutes)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {day.isHoliday ? <Badge tone="holiday">{day.holidayName}</Badge> : null}
            {day.isOnLeave ? <Badge tone="info">{statusLabel(day.leaveType)} leave</Badge> : null}
            {daily.data?.data.timesheet ? <Badge tone={daily.data.data.timesheet.status === 'approved' ? 'good' : daily.data.data.timesheet.status === 'rejected' ? 'bad' : 'pending'}>{statusLabel(daily.data.data.timesheet.status)}</Badge> : null}
          </div>

          <div className="space-y-3">
            {(daily.data?.data.entries ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">No entries for this day.</p>
            ) : (
              daily.data?.data.entries.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-line px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {entry.startTime} – {entry.endTime}
                        <span className="ml-2 text-sm font-normal text-muted">{formatMinutes(entry.durationMinutes)}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted">{entry.task?.title ?? entry.project?.name ?? 'Unassigned work'}</p>
                      <p className="mt-1 text-sm">{entry.description}</p>
                    </div>
                    {editable ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => beginEdit(entry)}>
                          Edit
                        </Button>
                        <Button variant="ghost" onClick={() => remove.mutate(entry.id)}>
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>

          {editable ? (
            <form className="space-y-4 border-t border-line pt-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">{editing ? 'Edit entry' : 'New entry'}</h3>
                {editing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null)
                      form.reset(emptyForm)
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
              <Field label="Work type" error={form.formState.errors.workType?.message}>
                <SelectInput {...form.register('workType')}>
                  <option value="assigned">Assigned task</option>
                  <option value="unassigned">Unassigned work</option>
                </SelectInput>
              </Field>
              {workType === 'assigned' ? (
                <Field label="Assigned task" error={form.formState.errors.taskId?.message}>
                  <SelectInput {...form.register('taskId')}>
                    <option value="">Select a task</option>
                    {(tasks.data?.data ?? []).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                        {task.project.name ? ` · ${task.project.name}` : ''}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : (
                <Field label="Project" error={form.formState.errors.projectId?.message}>
                  <SelectInput {...form.register('projectId')}>
                    <option value="">No project</option>
                    {(projects.data?.data ?? []).map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.code} · {project.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" error={form.formState.errors.startTime?.message}>
                  <TextInput type="time" {...form.register('startTime')} />
                </Field>
                <Field label="End" error={form.formState.errors.endTime?.message}>
                  <TextInput type="time" {...form.register('endTime')} />
                </Field>
              </div>
              <div className="rounded-2xl bg-accent-soft px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">Duration</p>
                <p className="font-display text-2xl">{duration == null ? '—' : formatMinutes(duration)}</p>
              </div>
              <Field label="Description" error={form.formState.errors.description?.message}>
                <TextArea placeholder="What did you work on?" {...form.register('description')} />
              </Field>
              <ErrorText message={save.error ? errorMessage(save.error) : null} />
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save entry'}
              </Button>
            </form>
          ) : null}
        </div>
      )}
    </Drawer>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display text-xl">{value}</p>
    </div>
  )
}
