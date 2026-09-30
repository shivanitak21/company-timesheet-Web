export function statusTone(status: string | null | undefined): 'neutral' | 'pending' | 'good' | 'bad' | 'info' {
  if (status === 'approved' || status === 'done' || status === 'active' || status === 'checked_out') return 'good'
  if (status === 'submitted' || status === 'pending' || status === 'in_progress' || status === 'checked_in') return 'pending'
  if (status === 'rejected' || status === 'cancelled') return 'bad'
  if (status === 'high') return 'bad'
  return 'neutral'
}
