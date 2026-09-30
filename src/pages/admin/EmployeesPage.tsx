import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { userApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, EmptyState, ErrorText, Field, Modal, PageHeader, SelectInput, Spinner, TextInput } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useUsers } from '@/hooks/queries'
import { personName, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import { employeeCreateSchema, type EmployeeCreateValues } from '@/validation/schemas'

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const users = useUsers(search)
  const toast = useToast()
  const client = useQueryClient()
  const toggle = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => userApi.update(input.id, { isActive: input.isActive }),
    onSuccess: async () => {
      toast.push('Account updated', 'success')
      await client.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Directory"
        title="Employees"
        description="Create accounts and turn access on or off. Profile fields are stored with the employee record."
        actions={<Button onClick={() => setOpen(true)}>New account</Button>}
      />
      <TextInput className="max-w-sm" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
      {users.isLoading ? <Spinner /> : null}
      {users.isError ? <ErrorText message={errorMessage(users.error)} /> : null}
      {(users.data?.data.length ?? 0) === 0 && !users.isLoading ? <EmptyState title="No accounts" body="Create the first employee, manager, or admin." /> : null}
      <div className="grid gap-3">
        {users.data?.data.map((account) => (
          <Card key={account.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-semibold">{personName(account)}</p>
              <p className="text-sm text-muted">{account.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={statusTone(account.role)}>{statusLabel(account.role)}</Badge>
              <Badge tone={account.isActive ? 'good' : 'bad'}>{account.isActive ? 'Active' : 'Disabled'}</Badge>
              <Button variant="secondary" onClick={() => toggle.mutate({ id: account.id, isActive: !account.isActive })}>
                {account.isActive ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <CreateAccount open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function CreateAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const managers = useUsers(undefined, 'manager')
  const toast = useToast()
  const client = useQueryClient()
  const form = useForm<EmployeeCreateValues>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      employeeCode: '',
      department: '',
      designation: '',
      joiningDate: '',
      employmentType: 'full_time',
      weeklyHours: '40',
      phone: '',
      managerId: '',
    },
  })
  const create = useMutation({
    mutationFn: userApi.create,
    onSuccess: async () => {
      toast.push('Account created', 'success')
      await client.invalidateQueries({ queryKey: ['users'] })
      await client.invalidateQueries({ queryKey: ['employees'] })
      form.reset()
      onClose()
    },
  })

  return (
    <Modal open={open} title="New account" onClose={onClose}>
      <form
        className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) => {
          if (values.role !== 'admin' && (!values.employeeCode || !values.department || !values.designation || !values.joiningDate)) {
            toast.push('Code, department, designation, and joining date are required for this role.', 'error')
            return
          }
          create.mutate({
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            ...(values.employeeCode ? { employeeCode: values.employeeCode } : {}),
            ...(values.department ? { department: values.department } : {}),
            ...(values.designation ? { designation: values.designation } : {}),
            ...(values.joiningDate ? { joiningDate: values.joiningDate } : {}),
            ...(values.employmentType ? { employmentType: values.employmentType } : {}),
            ...(values.weeklyHours ? { weeklyHours: Number(values.weeklyHours) } : {}),
            ...(values.phone ? { phone: values.phone } : {}),
            ...(values.managerId ? { managerId: values.managerId } : {}),
          })
        })}
      >
        <Field label="First name" error={form.formState.errors.firstName?.message}>
          <TextInput {...form.register('firstName')} />
        </Field>
        <Field label="Last name" error={form.formState.errors.lastName?.message}>
          <TextInput {...form.register('lastName')} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <TextInput type="email" {...form.register('email')} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <TextInput type="password" {...form.register('password')} />
        </Field>
        <Field label="Role">
          <SelectInput {...form.register('role')}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </SelectInput>
        </Field>
        <Field label="Manager">
          <SelectInput {...form.register('managerId')}>
            <option value="">None</option>
            {managers.data?.data.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {personName(manager)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Employee code">
          <TextInput {...form.register('employeeCode')} />
        </Field>
        <Field label="Department">
          <TextInput {...form.register('department')} />
        </Field>
        <Field label="Designation">
          <TextInput {...form.register('designation')} />
        </Field>
        <Field label="Joining date">
          <TextInput type="date" {...form.register('joiningDate')} />
        </Field>
        <Field label="Employment">
          <SelectInput {...form.register('employmentType')}>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
          </SelectInput>
        </Field>
        <Field label="Weekly hours">
          <TextInput type="number" {...form.register('weeklyHours')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Phone">
            <TextInput {...form.register('phone')} />
          </Field>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <ErrorText message={create.error ? errorMessage(create.error) : null} />
          <Button type="submit" disabled={create.isPending}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  )
}
