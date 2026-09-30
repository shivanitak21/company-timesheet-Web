import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui/primitives'
import { useNotifications } from '@/hooks/queries'
import { formatDateTime } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'

export function NotificationsPage() {
  const notes = useNotifications(false)
  const toast = useToast()
  const client = useQueryClient()
  const mark = useMutation({
    mutationFn: async (id?: string) => {
      if (id) await notificationApi.markRead(id)
      else await notificationApi.markAllRead()
    },
    onSuccess: async () => {
      await client.invalidateQueries({ predicate: (query) => ['notifications', 'unread'].includes(String(query.queryKey[0])) })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Approvals, assignments, and decisions sent to your account."
        actions={
          <Button variant="secondary" onClick={() => mark.mutate(undefined)}>
            Mark all read
          </Button>
        }
      />
      {notes.isLoading ? <Spinner /> : null}
      {notes.isError ? <ErrorText message={errorMessage(notes.error)} /> : null}
      {(notes.data?.data.length ?? 0) === 0 && !notes.isLoading ? <EmptyState title="All quiet" body="New notices will show up here." /> : null}
      <div className="grid gap-3">
        {notes.data?.data.map((item) => (
          <Card key={item.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm">{item.message}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
              </div>
              {!item.readAt ? (
                <Button variant="ghost" onClick={() => mark.mutate(item.id)}>
                  Mark read
                </Button>
              ) : (
                <span className="text-xs text-muted">Read</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
