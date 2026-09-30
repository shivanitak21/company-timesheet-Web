import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { holidayApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, EmptyState, ErrorText, Field, PageHeader, Spinner, TextInput } from '@/components/ui/primitives'
import { useHolidays } from '@/hooks/queries'
import { currentYearMonth, formatDate } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import { holidaySchema } from '@/validation/schemas'

export function HolidaysPage() {
  const now = currentYearMonth()
  const [year, setYear] = useState(now.year)
  const holidays = useHolidays(year)
  const toast = useToast()
  const client = useQueryClient()
  const form = useForm<{ name: string; date: string }>({ resolver: zodResolver(holidaySchema), defaultValues: { name: '', date: '' } })
  const create = useMutation({
    mutationFn: holidayApi.create,
    onSuccess: async () => {
      toast.push('Holiday added', 'success')
      form.reset()
      await client.invalidateQueries({ queryKey: ['holidays'] })
      await client.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
  const remove = useMutation({
    mutationFn: holidayApi.remove,
    onSuccess: async () => {
      toast.push('Holiday removed', 'success')
      await client.invalidateQueries({ queryKey: ['holidays'] })
      await client.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Calendar" title="Holidays" description="Company holidays are closed on the timesheet. The API treats them as non-fillable days." />
      <Card className="p-5">
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
          <Field label="Name" error={form.formState.errors.name?.message}>
            <TextInput {...form.register('name')} />
          </Field>
          <Field label="Date" error={form.formState.errors.date?.message}>
            <TextInput type="date" {...form.register('date')} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={create.isPending}>
              Add holiday
            </Button>
          </div>
        </form>
        <ErrorText message={create.error ? errorMessage(create.error) : null} />
      </Card>
      <TextInput className="w-32" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
      {holidays.isLoading ? <Spinner /> : null}
      {(holidays.data?.data.rows.length ?? 0) === 0 && !holidays.isLoading ? <EmptyState title="No holidays" body="Add dates the company observes this year." /> : null}
      <div className="grid gap-3">
        {holidays.data?.data.rows.map((holiday) => (
          <Card key={holiday.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold">{holiday.name}</p>
              <p className="text-sm text-muted">{formatDate(holiday.date)}</p>
            </div>
            <Button variant="ghost" onClick={() => remove.mutate(holiday.id)}>
              Remove
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
