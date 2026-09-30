import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { projectApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, EmptyState, ErrorText, Field, Modal, PageHeader, SelectInput, Spinner, TextArea, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useEmployees, useProjects, useUsers } from '@/hooks/queries'
import { personName, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import { projectSchema, type ProjectValues } from '@/validation/schemas'

export function ProjectsPage() {
  const [open, setOpen] = useState(false)
  const projects = useProjects()
  const toast = useToast()
  const client = useQueryClient()
  const archive = useMutation({
    mutationFn: (input: { id: string; status: 'active' | 'archived' }) => projectApi.update(input.id, { status: input.status }),
    onSuccess: async () => {
      toast.push('Project updated', 'success')
      await client.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Delivery" title="Projects" description="Active projects can receive time and tasks. Archived projects stay on record." actions={<Button onClick={() => setOpen(true)}>New project</Button>} />
      {projects.isLoading ? <Spinner /> : null}
      {projects.isError ? <ErrorText message={errorMessage(projects.error)} /> : null}
      {(projects.data?.data.length ?? 0) === 0 && !projects.isLoading ? <EmptyState title="No projects" body="Create a project before assigning tasks." /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {projects.data?.data.map((project) => (
          <Card key={project.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gold">{project.code}</p>
                <h2 className="font-display text-2xl">{project.name}</h2>
              </div>
              <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{project.description || 'No description'}</p>
            <p className="mt-3 text-sm">Manager · {personName(project.manager)}</p>
            <p className="text-sm text-muted">{project.members.length} members</p>
            <Button className="mt-4" variant="secondary" onClick={() => archive.mutate({ id: project.id, status: project.status === 'active' ? 'archived' : 'active' })}>
              {project.status === 'active' ? 'Archive' : 'Restore'}
            </Button>
          </Card>
        ))}
      </div>
      <ProjectForm open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function ProjectForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const managers = useUsers()
  const people = useEmployees()
  const toast = useToast()
  const client = useQueryClient()
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', code: '', description: '', managerId: '', memberIds: [], startDate: '', endDate: '', status: 'active' },
  })
  const create = useMutation({
    mutationFn: projectApi.create,
    onSuccess: async () => {
      toast.push('Project created', 'success')
      await client.invalidateQueries({ queryKey: ['projects'] })
      form.reset()
      onClose()
    },
  })
  return (
    <Modal open={open} title="New project" onClose={onClose}>
      <form
        className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((values) =>
          create.mutate({
            name: values.name,
            code: values.code,
            description: values.description || '',
            managerId: values.managerId,
            memberIds: values.memberIds,
            status: values.status,
            ...(values.startDate ? { startDate: values.startDate } : {}),
            ...(values.endDate ? { endDate: values.endDate } : {}),
          }),
        )}
      >
        <Field label="Name" error={form.formState.errors.name?.message}>
          <TextInput {...form.register('name')} />
        </Field>
        <Field label="Code" error={form.formState.errors.code?.message}>
          <TextInput {...form.register('code')} />
        </Field>
        <Field label="Manager" error={form.formState.errors.managerId?.message}>
          <SelectInput {...form.register('managerId')}>
            <option value="">Select</option>
            {managers.data?.data
              .filter((person) => person.role === 'manager' || person.role === 'admin')
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {personName(person)}
                </option>
              ))}
          </SelectInput>
        </Field>
        <Field label="Members">
          <SelectInput multiple className="min-h-28" {...form.register('memberIds')}>
            {people.data?.data.map((person) => (
              <option key={person.user?.id} value={person.user?.id}>
                {personName(person.user)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Description">
          <TextArea {...form.register('description')} />
        </Field>
        <ErrorText message={create.error ? errorMessage(create.error) : null} />
        <Button type="submit" disabled={create.isPending}>
          Create project
        </Button>
      </form>
    </Modal>
  )
}
