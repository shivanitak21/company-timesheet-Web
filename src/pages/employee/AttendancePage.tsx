import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { attendanceApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, ErrorText, PageHeader, Spinner } from '@/components/ui/primitives'
import { statusTone } from '@/lib/status'
import { useAttendanceHistory, useTodayAttendance } from '@/hooks/queries'
import { currentYearMonth, formatDate, formatMinutes, formatTime, monthRange, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'

export function AttendancePage() {
  const now = currentYearMonth()
  const range = monthRange(now.year, now.month)
  const today = useTodayAttendance()
  const history = useAttendanceHistory(range.from, range.to)
  const [notes, setNotes] = useState('')
  const toast = useToast()
  const client = useQueryClient()
  const punch = useMutation({
    mutationFn: (kind: 'in' | 'out') => (kind === 'in' ? attendanceApi.checkIn(notes) : attendanceApi.checkOut(notes)),
    onSuccess: async () => {
      toast.push('Attendance updated', 'success')
      setNotes('')
      await client.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('attendance') })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })
  const record = today.data?.data.attendance

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Presence" title="Attendance" description="Check in and out for today. History for this month comes from your attendance record." />
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-3xl">{record ? statusLabel(record.status) : 'Not checked in'}</p>
            <p className="mt-1 text-sm text-muted">
              {record ? `${formatTime(record.checkInAt)}${record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ''}` : 'Ready when you are.'}
            </p>
          </div>
          <Badge tone={statusTone(record?.status)}>{record ? formatMinutes(record.workMinutes ?? 0) : 'Today'}</Badge>
        </div>
        <textarea
          className="mt-4 w-full rounded-2xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
          placeholder="Optional note"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <Button disabled={punch.isPending || Boolean(record)} onClick={() => punch.mutate('in')}>
            Check in
          </Button>
          <Button variant="secondary" disabled={punch.isPending || record?.status !== 'checked_in'} onClick={() => punch.mutate('out')}>
            Check out
          </Button>
        </div>
      </Card>
      {history.isLoading ? <Spinner /> : null}
      {history.isError ? <ErrorText message={errorMessage(history.error)} /> : null}
      <div className="grid gap-3">
        {history.data?.data.rows.map((row) => (
          <Card key={row.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold">{formatDate(row.date)}</p>
              <p className="text-sm text-muted">
                {formatTime(row.checkInAt)}
                {row.checkOutAt ? ` – ${formatTime(row.checkOutAt)}` : ' · still in'}
              </p>
            </div>
            <p className="font-display text-xl">{formatMinutes(row.workMinutes ?? 0)}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
