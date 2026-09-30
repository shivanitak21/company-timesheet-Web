import { useState } from 'react'
import { Card, EmptyState, ErrorText, PageHeader, Spinner, TextInput } from '@/components/ui/primitives'
import { useEmployees } from '@/hooks/queries'
import { errorMessage } from '@/api/client'
import { personName, statusLabel } from '@/lib/format'

export function TeamPage() {
  const [search, setSearch] = useState('')
  const team = useEmployees(search)

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="People" title="Team" description="Direct reports and your own profile, as returned by the employee directory." />
      <TextInput className="max-w-sm" placeholder="Search name or code" value={search} onChange={(event) => setSearch(event.target.value)} />
      {team.isLoading ? <Spinner /> : null}
      {team.isError ? <ErrorText message={errorMessage(team.error)} /> : null}
      {(team.data?.data.length ?? 0) === 0 && !team.isLoading ? <EmptyState title="No one here" body="Employees assigned to you will appear in this list." /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {team.data?.data.map((person) => (
          <Card key={person.id} className="p-5">
            <p className="font-display text-2xl">{personName(person.user)}</p>
            <p className="text-sm text-muted">{person.designation}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted">Code</dt>
                <dd>{person.employeeCode}</dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd>{person.department}</dd>
              </div>
              <div>
                <dt className="text-muted">Type</dt>
                <dd>{statusLabel(person.employmentType)}</dd>
              </div>
              <div>
                <dt className="text-muted">Manager</dt>
                <dd>{personName(person.manager)}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  )
}
