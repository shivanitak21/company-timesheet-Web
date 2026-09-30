import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { authApi, employeeApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, ErrorText, Field, PageHeader, TextInput } from '@/components/ui/primitives'
import { formatDate, personName, statusLabel } from '@/lib/format'
import { useAuth } from '@/state/AuthProvider'
import { useToast } from '@/state/ToastProvider'
import { changePasswordSchema, profilePhoneSchema } from '@/validation/schemas'

export function ProfilePage() {
  const { user, profile, logout, refreshMe } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const phoneForm = useForm<{ phone: string }>({ resolver: zodResolver(profilePhoneSchema), values: { phone: profile?.phone ?? '' } })
  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })
  const savePhone = useMutation({
    mutationFn: (phone: string) => employeeApi.update(profile?.id ?? '', { phone }),
    onSuccess: async () => {
      toast.push('Phone updated', 'success')
      await refreshMe()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })
  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async () => {
      toast.push('Password changed. Sign in again.', 'success')
      await logout()
      navigate('/login')
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Account" title={personName(user)} description={user?.email} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 p-5 text-sm">
          <Row label="Role" value={statusLabel(user?.role)} />
          <Row label="Department" value={profile?.department ?? '—'} />
          <Row label="Designation" value={profile?.designation ?? '—'} />
          <Row label="Employee code" value={profile?.employeeCode ?? '—'} />
          <Row label="Joined" value={formatDate(profile?.joiningDate)} />
          <Row label="Weekly hours" value={profile ? String(profile.weeklyHours) : '—'} />
          <Row label="Manager" value={personName(profile?.manager)} />
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl">Phone</h2>
          {profile ? (
            <form className="mt-4 space-y-3" onSubmit={phoneForm.handleSubmit((values) => savePhone.mutate(values.phone))}>
              <Field label="Phone" error={phoneForm.formState.errors.phone?.message}>
                <TextInput {...phoneForm.register('phone')} />
              </Field>
              <Button type="submit" disabled={savePhone.isPending}>
                Save phone
              </Button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted">This account has no employee profile.</p>
          )}
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="font-display text-2xl">Password</h2>
        <p className="mt-1 text-sm text-muted">Changing your password signs you out of every session.</p>
        <form className="mt-4 grid max-w-lg gap-3" onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}>
          <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
            <TextInput type="password" {...passwordForm.register('currentPassword')} />
          </Field>
          <Field label="New password" error={passwordForm.formState.errors.newPassword?.message}>
            <TextInput type="password" {...passwordForm.register('newPassword')} />
          </Field>
          <ErrorText message={changePassword.error ? errorMessage(changePassword.error) : null} />
          <Button type="submit" disabled={changePassword.isPending}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
