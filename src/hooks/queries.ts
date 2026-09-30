import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attendanceApi,
  employeeApi,
  holidayApi,
  leaveApi,
  notificationApi,
  projectApi,
  taskApi,
  timesheetApi,
  userApi,
} from '@/api/resources'
import type { EntryPayload, LeaveStatus, ProjectStatus, TaskStatus } from '@/types/api'

export const keys = {
  calendar: (year: number, month: number, userId?: string) => ['calendar', year, month, userId ?? 'self'] as const,
  daily: (date: string, userId?: string) => ['daily', date, userId ?? 'self'] as const,
  pendingTimesheets: ['pending-timesheets'] as const,
  attendanceToday: ['attendance-today'] as const,
  attendanceHistory: (from?: string, to?: string, userId?: string) => ['attendance-history', from, to, userId] as const,
  tasks: (scope: string, status?: string) => ['tasks', scope, status ?? 'all'] as const,
  projects: (status?: string, search?: string) => ['projects', status ?? 'all', search ?? ''] as const,
  leaves: (status?: string) => ['leaves', status ?? 'all'] as const,
  pendingLeaves: ['pending-leaves'] as const,
  holidays: (year: number) => ['holidays', year] as const,
  notifications: (unreadOnly?: string) => ['notifications', unreadOnly ?? 'all'] as const,
  unread: ['unread'] as const,
  employees: (search?: string, department?: string) => ['employees', search ?? '', department ?? ''] as const,
  users: (search?: string, role?: string) => ['users', search ?? '', role ?? ''] as const,
  reportAttendance: (from: string, to: string, userId?: string) => ['report-attendance', from, to, userId] as const,
  reportTimesheets: (year: number, month: number, userId?: string) => ['report-timesheets', year, month, userId] as const,
  reportLeaves: (year: number, userId?: string) => ['report-leaves', year, userId] as const,
  audit: (entityType?: string) => ['audit', entityType ?? ''] as const,
}

export function useCalendar(year: number, month: number, userId?: string) {
  return useQuery({
    queryKey: keys.calendar(year, month, userId),
    queryFn: () => timesheetApi.calendar({ year, month, userId }),
  })
}

export function useDaily(date: string | null, userId?: string) {
  return useQuery({
    queryKey: keys.daily(date ?? '', userId),
    queryFn: () => timesheetApi.daily({ date: date as string, userId }),
    enabled: Boolean(date),
  })
}

export function useInvalidateTimesheets() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ predicate: (query) => ['calendar', 'daily', 'pending-timesheets', 'report-timesheets'].includes(String(query.queryKey[0])) })
}

export function usePendingTimesheets() {
  return useQuery({ queryKey: keys.pendingTimesheets, queryFn: () => timesheetApi.pending({ page: 1, limit: 50 }) })
}

export function useTodayAttendance() {
  return useQuery({ queryKey: keys.attendanceToday, queryFn: () => attendanceApi.today() })
}

export function useAttendanceHistory(from?: string, to?: string, userId?: string) {
  return useQuery({
    queryKey: keys.attendanceHistory(from, to, userId),
    queryFn: () => attendanceApi.history({ from, to, userId }),
  })
}

export function useTasks(scope: 'assigned' | 'all', status?: TaskStatus) {
  return useQuery({
    queryKey: keys.tasks(scope, status),
    queryFn: () => (scope === 'assigned' ? taskApi.assigned({ limit: 50, status }) : taskApi.list({ limit: 50, status })),
  })
}

export function useProjects(status?: ProjectStatus, search?: string) {
  return useQuery({
    queryKey: keys.projects(status, search),
    queryFn: () => projectApi.list({ limit: 100, status, search: search || undefined }),
  })
}

export function useLeaves(status?: LeaveStatus) {
  return useQuery({
    queryKey: keys.leaves(status),
    queryFn: () => leaveApi.list({ limit: 50, status }),
  })
}

export function usePendingLeaves() {
  return useQuery({ queryKey: keys.pendingLeaves, queryFn: () => leaveApi.pending({ page: 1, limit: 50 }) })
}

export function useHolidays(year: number) {
  return useQuery({ queryKey: keys.holidays(year), queryFn: () => holidayApi.list(year) })
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: keys.notifications(unreadOnly ? 'true' : 'false'),
    queryFn: () => notificationApi.list({ limit: 40, unreadOnly: unreadOnly ? 'true' : 'false' }),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: () => notificationApi.unread(),
    refetchInterval: 60_000,
  })
}

export function useEmployees(search?: string, department?: string) {
  return useQuery({
    queryKey: keys.employees(search, department),
    queryFn: () => employeeApi.list({ limit: 100, search: search || undefined, department: department || undefined }),
  })
}

export function useUsers(search?: string, role?: string) {
  return useQuery({
    queryKey: keys.users(search, role),
    queryFn: () => userApi.list({ limit: 100, search: search || undefined, role: role || undefined }),
  })
}

export function useEntryMutation() {
  const invalidate = useInvalidateTimesheets()
  return useMutation({
    mutationFn: (input: { entryId?: string; body: EntryPayload }) =>
      input.entryId ? timesheetApi.updateEntry(input.entryId, input.body) : timesheetApi.createEntry(input.body),
    onSuccess: invalidate,
  })
}
