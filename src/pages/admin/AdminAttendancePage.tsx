import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { attendanceApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, ErrorText, PageHeader, SelectInput, Spinner, TextInput } from '@/components/ui/primitives'
import { useAttendanceHistory, useEmployees } from '@/hooks/queries'
import { currentYearMonth, formatDate, formatMinutes, formatTime, monthRange, personName } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'

export function AdminAttendancePage() {
  const now = currentYearMonth()
  const initial = monthRange(now.year, now.month)
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [userId, setUserId] = useState('')
  const people = useEmployees()
  const history = useAttendanceHistory(from, to, userId || undefined)
  const toast = useToast()
  const client = useQueryClient()
  const correct = useMutation({
    mutationFn: (input: { id: string; checkInAt?: string; checkOutAt?: string }) => attendanceApi.correct(input.id, { checkInAt: input.checkInAt, checkOutAt: input.checkOutAt }),
    onSuccess: async () => {
      toast.push('Attendance corrected', 'success')
      await client.invalidateQueries({ queryKey: ['attendance-history'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Presence" title="Attendance" description="Review punches and correct a record when a manager or admin needs to fix the time." />
      <div className="flex flex-wrap gap-2">
        <TextInput className="w-44" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <TextInput className="w-44" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <SelectInput className="w-64" value={userId} onChange={(event) => setUserId(event.target.value)}>
          <option value="">My attendance</option>
          {people.data?.data.map((person) => (
            <option key={person.user?.id} value={person.user?.id}>
              {personName(person.user)}
            </option>
          ))}
        </SelectInput>
      </div>
      {history.isLoading ? <Spinner /> : null}
      {history.isError ? <ErrorText message={errorMessage(history.error)} /> : null}
      <div className="grid gap-3">
        {history.data?.data.rows.map((row) => (
          <Card key={row.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{formatDate(row.date)}</p>
                <p className="text-sm text-muted">
                  {formatTime(row.checkInAt)}
                  {row.checkOutAt ? ` – ${formatTime(row.checkOutAt)}` : ''} · {formatMinutes(row.workMinutes ?? 0)}
                </p>
              </div>
            </div>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                const checkIn = String(data.get('checkIn') ?? '')
                const checkOut = String(data.get('checkOut') ?? '')
                if (!checkIn && !checkOut) return
                correct.mutate({
                  id: row.id,
                  ...(checkIn ? { checkInAt: new Date(checkIn).toISOString() } : {}),
                  ...(checkOut ? { checkOutAt: new Date(checkOut).toISOString() } : {}),
                })
              }}
            >
              <TextInput name="checkIn" type="datetime-local" aria-label="Corrected check in" />
              <TextInput name="checkOut" type="datetime-local" aria-label="Corrected check out" />
              <Button type="submit" variant="secondary">
                Correct
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  )
}
