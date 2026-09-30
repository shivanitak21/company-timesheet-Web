import type { Role } from '@/types/api'

export function homeForRole(role: Role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'manager') return '/manager/dashboard'
  return '/dashboard'
}
