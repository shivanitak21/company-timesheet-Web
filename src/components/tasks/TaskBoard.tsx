import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { taskApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, EmptyState, ErrorText, Field, Modal, PageHeader, SelectInput, Spinner, TextArea, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useEmployees, useProjects, useTasks } from '@/hooks/queries'
import { formatDate, formatMinutes, personName, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import type { TaskStatus } from '@/types/api'
import { taskSchema, type TaskValues } from '@/validation/schemas'

export function TaskBoard({ mode }: { mode: 'self' | 'manage' }) {
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [open, setOpen] = useState(false)
  const tasks = useTasks(mode === 'self' ? 'assigned' : 'all', status || undefined)
  const toast = useToast()
  const client = useQueryClient()
  const update = useMutation({
    mutationFn: (input: { id: string; status: TaskStatus }) => taskApi.update(input.id, { status: input.status }),
    onSuccess: async () => {
      toast.push('Task updated', 'success')
      await client.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div>
      <PageHeader
        eyebrow="Work"
        title={mode === 'self' ? 'My tasks' : 'Tasks'}
        description={mode === 'self' ? 'Update the status of work assigned to you.' : 'Create work and assign it to people on active projects.'}
        actions={
          <>
            <SelectInput className="w-40" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | '')}>
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </SelectInput>
            {mode === 'manage' ? <Button onClick={() => setOpen(true)}>New task</Button> : null}
          </>
        }
      />
      {tasks.isLoading ? <Spinner /> : null}
      {tasks.isError ? <ErrorText message={errorMessage(tasks.error)} /> : null}
      {!tasks.isLoading && (tasks.data?.data.length ?? 0) === 0 ? <EmptyState title="No tasks" body="Assigned work will appear here once a manager or admin creates it." /> : null}
      <div className="grid gap-3">
        {tasks.data?.data.map((task) => (
          <Card key={task.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{task.title}</h2>
                <Badge tone={statusTone(task.priority)}>{statusLabel(task.priority)}</Badge>
                <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {task.project.name ?? 'Project'} · {personName(task.assignedTo)}
                {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}
                {task.estimatedMinutes ? ` · ${formatMinutes(task.estimatedMinutes)}` : ''}
              </p>
              {task.description ? <p className="mt-2 max-w-3xl text-sm">{task.description}</p> : null}
            </div>
            <SelectInput
              className="w-44"
              value={task.status}
              onChange={(event) => update.mutate({ id: task.id, status: event.target.value as TaskStatus })}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              {mode === 'manage' ? <option value="cancelled">Cancelled</option> : null}
            </SelectInput>
          </Card>
        ))}
      </div>
      {mode === 'manage' ? <TaskForm open={open} onClose={() => setOpen(false)} /> : null}
    </div>
  )
}

function TaskForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useProjects('active')
  const people = useEmployees()
  const toast = useToast()
  const client = useQueryClient()
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { projectId: '', title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedMinutes: '' },
  })
  const create = useMutation({
    mutationFn: taskApi.create,
    onSuccess: async () => {
      toast.push('Task assigned', 'success')
      await client.invalidateQueries({ queryKey: ['tasks'] })
      form.reset()
      onClose()
    },
  })

  return (
    <Modal open={open} title="Assign a task" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) =>
          create.mutate({
            projectId: values.projectId,
            title: values.title,
            description: values.description || '',
            assignedTo: values.assignedTo,
            priority: values.priority,
            ...(values.dueDate ? { dueDate: values.dueDate } : {}),
            ...(values.estimatedMinutes ? { estimatedMinutes: Number(values.estimatedMinutes) } : {}),
          }),
        )}
      >
        <Field label="Project" error={form.formState.errors.projectId?.message}>
          <SelectInput {...form.register('projectId')}>
            <option value="">Select</option>
            {projects.data?.data.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} · {project.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Title" error={form.formState.errors.title?.message}>
          <TextInput {...form.register('title')} />
        </Field>
        <Field label="Assignee" error={form.formState.errors.assignedTo?.message}>
          <SelectInput {...form.register('assignedTo')}>
            <option value="">Select</option>
            {people.data?.data.map((person) => (
              <option key={person.user?.id} value={person.user?.id}>
                {personName(person.user)} · {person.employeeCode}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <SelectInput {...form.register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </SelectInput>
          </Field>
          <Field label="Due date">
            <TextInput type="date" {...form.register('dueDate')} />
          </Field>
        </div>
        <Field label="Estimate (minutes)">
          <TextInput type="number" min={1} {...form.register('estimatedMinutes')} />
        </Field>
        <Field label="Description">
          <TextArea {...form.register('description')} />
        </Field>
        <ErrorText message={create.error ? errorMessage(create.error) : null} />
        <Button type="submit" disabled={create.isPending}>
          Create task
        </Button>
      </form>
    </Modal>
  )
}
