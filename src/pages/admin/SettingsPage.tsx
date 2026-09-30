import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, ErrorText, PageHeader } from '@/components/ui/primitives'
import { useAuth } from '@/state/AuthProvider'
import { useTheme } from '@/state/ThemeProvider'
import { useToast } from '@/state/ToastProvider'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const endSessions = useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: async () => {
      toast.push('All sessions signed out', 'success')
      await logout()
      navigate('/login')
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Appearance and session controls. Timesheet rules, holidays, and permissions stay on the API."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl">Appearance</h2>
          <p className="mt-2 text-sm text-muted">The sidebar stays dark. The workspace follows this theme.</p>
          <div className="mt-4 flex gap-2">
            <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>
              Light
            </Button>
            <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>
              Dark
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-2xl">Sessions</h2>
          <p className="mt-2 text-sm text-muted">Sign out every device that still holds a refresh token for this account.</p>
          <Button className="mt-4" variant="danger" disabled={endSessions.isPending} onClick={() => endSessions.mutate()}>
            Sign out everywhere
          </Button>
          {endSessions.isError ? <div className="mt-3"><ErrorText message={errorMessage(endSessions.error)} /></div> : null}
        </Card>
      </div>
    </div>
  )
}
