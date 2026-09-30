import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { Button, ErrorText, Field, ScreenLoader, TextInput } from '@/components/ui/primitives'
import { homeForRole } from '@/lib/roles'
import { useAuth } from '@/state/AuthProvider'
import { loginSchema, type LoginValues } from '@/validation/schemas'

export function LoginPage() {
  const { status, user, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (status === 'loading') return <ScreenLoader />
  if (status === 'authenticated' && user) return <Navigate to={homeForRole(user.role)} replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#12161c] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <p className="font-display text-3xl">Meridian</p>
          <p className="mt-2 text-sm tracking-[0.18em] text-white/45 uppercase">Timesheets · Attendance · Leave</p>
        </div>
        <div className="max-w-lg">
          <p className="font-display text-5xl leading-tight">A quieter way to account for the month.</p>
          <p className="mt-5 text-base leading-7 text-white/65">
            Working days, holidays, and approved leave stay in one calendar. The company API decides what can be filled.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-white/70">
          <div className="rounded-3xl border border-white/10 p-4">
            <p className="font-display text-2xl text-[#e2b15a]">01</p>
            <p className="mt-2">Log the day</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-4">
            <p className="font-display text-2xl text-[#5dcec2]">02</p>
            <p className="mt-2">Submit the month</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-4">
            <p className="font-display text-2xl text-white">03</p>
            <p className="mt-2">Review as a team</p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use the account issued by your administrator.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null)
              try {
                const signedIn = await login(values.email, values.password)
                navigate(homeForRole(signedIn.role))
              } catch (caught) {
                setError(errorMessage(caught))
              }
            })}
          >
            <Field label="Email" error={form.formState.errors.email?.message}>
              <TextInput type="email" autoComplete="email" {...form.register('email')} />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <TextInput type="password" autoComplete="current-password" {...form.register('password')} />
            </Field>
            <ErrorText message={error} />
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Continue'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
