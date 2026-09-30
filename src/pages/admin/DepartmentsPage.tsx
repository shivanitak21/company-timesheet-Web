import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { employeeApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Button, Card, EmptyState, PageHeader, TextInput } from '@/components/ui/primitives'
import { useEmployees } from '@/hooks/queries'
import { personName } from '@/lib/format'
import type { EmployeeProfile } from '@/types/api'
import { useToast } from '@/state/ToastProvider'

export function DepartmentsPage() {
  const people = useEmployees()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const toast = useToast()
  const client = useQueryClient()
  const save = useMutation({
    mutationFn: (input: { id: string; department: string }) => employeeApi.update(input.id, { department: input.department }),
    onSuccess: async () => {
      toast.push('Department updated', 'success')
      await client.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const rows = people.data?.data
  const groups = useMemo(() => {
    const map = new Map<string, EmployeeProfile[]>()
    for (const person of rows ?? []) {
      const key = person.department || 'Unassigned'
      map.set(key, [...(map.get(key) ?? []), person])
    }
    return [...map.entries()].sort(([left], [right]) => left.localeCompare(right))
  }, [rows])

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Departments are the labels on employee profiles. Rename one here and the directory updates through the employee API."
      />
      {groups.length === 0 ? <EmptyState title="No departments yet" body="Create employees with a department to see them grouped here." /> : null}
      <div className="grid gap-4">
        {groups.map(([name, members]) => (
          <Card key={name} className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">{name}</h2>
              <p className="text-sm text-muted">{members.length} people</p>
            </div>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{personName(member.user)}</p>
                    <p className="text-sm text-muted">{member.designation}</p>
                  </div>
                  <TextInput
                    className="sm:max-w-xs"
                    value={drafts[member.id] ?? member.department}
                    onChange={(event) => setDrafts((current) => ({ ...current, [member.id]: event.target.value }))}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => save.mutate({ id: member.id, department: (drafts[member.id] ?? member.department).trim() })}
                  >
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
