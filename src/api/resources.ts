import { api } from '@/api/client'
import type {
  Attendance,
  AttendanceReportRow,
  AuditRow,
  AuthUser,
  DailyTimesheet,
  EmployeeProfile,
  EntryPayload,
  Holiday,
  Leave,
  LeaveReportRow,
  LeaveStatus,
  LoginResult,
  MeResult,
  MonthCalendar,
  NotificationItem,
  PendingTimesheet,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TimeEntry,
  Timesheet,
  TimesheetReportRow,
  UserSummary,
} from '@/types/api'

export const authApi = {
  login: (body: { email: string; password: string }) => api.post<LoginResult>('/auth/login', body),
  logout: (refreshToken: string) => api.post<{ revoked: boolean }>('/auth/logout', { refreshToken }),
  logoutAll: () => api.post<{ revoked: boolean }>('/auth/logout-all'),
  me: () => api.get<MeResult>('/auth/me'),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<{ changed: boolean }>('/auth/change-password', body),
}

export const userApi = {
  list: (params: { page?: number; limit?: number; search?: string; role?: string; isActive?: 'true' | 'false' }) =>
    api.get<UserSummary[]>('/users', params),
  create: (body: Record<string, unknown>) => api.post<{ user: AuthUser; profile: EmployeeProfile | null }>('/users', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<{ user: AuthUser; profile: EmployeeProfile | null }>(`/users/${id}`, body),
  resetPassword: (id: string, password: string) => api.post<{ reset: boolean }>(`/users/${id}/reset-password`, { password }),
}

export const employeeApi = {
  list: (params: { page?: number; limit?: number; search?: string; department?: string; managerId?: string }) =>
    api.get<EmployeeProfile[]>('/employees', params),
  me: () => api.get<EmployeeProfile>('/employees/me'),
  update: (id: string, body: Record<string, unknown>) => api.patch<EmployeeProfile>(`/employees/${id}`, body),
}

export const timesheetApi = {
  calendar: (params: { year: number; month: number; userId?: string }) => api.get<MonthCalendar>('/timesheets/calendar', params),
  daily: (params: { date: string; userId?: string }) => api.get<DailyTimesheet>('/timesheets/daily', params),
  pending: (params: { page?: number; limit?: number }) => api.get<PendingTimesheet[]>('/timesheets/pending', params),
  createEntry: (body: EntryPayload) =>
    api.post<{ entry: TimeEntry; timesheet: Timesheet; dayTotalMinutes: number; monthTotalMinutes: number }>('/timesheets/entries', body),
  updateEntry: (entryId: string, body: EntryPayload) =>
    api.patch<{ entry: TimeEntry; timesheet: Timesheet; dayTotalMinutes: number; monthTotalMinutes: number }>(
      `/timesheets/entries/${entryId}`,
      body,
    ),
  deleteEntry: (entryId: string) => api.delete<{ deleted: boolean }>(`/timesheets/entries/${entryId}`),
  submit: (id: string) => api.post<Timesheet>(`/timesheets/${id}/submit`),
  approve: (id: string) => api.post<Timesheet>(`/timesheets/${id}/approve`),
  reject: (id: string, reason: string) => api.post<Timesheet>(`/timesheets/${id}/reject`, { reason }),
}

export const attendanceApi = {
  checkIn: (notes?: string) => api.post<Attendance>('/attendance/check-in', { platform: 'web', notes: notes || undefined }),
  checkOut: (notes?: string) => api.post<Attendance>('/attendance/check-out', { platform: 'web', notes: notes || undefined }),
  today: () => api.get<{ attendance: Attendance | null }>('/attendance/today'),
  history: (params: { from?: string; to?: string; userId?: string }) =>
    api.get<{ from: string; to: string; userId: string; rows: Attendance[] }>('/attendance/history', params),
  correct: (id: string, body: { checkInAt?: string; checkOutAt?: string; notes?: string | null }) =>
    api.patch<Attendance>(`/attendance/${id}`, body),
}

export const taskApi = {
  assigned: (params: { page?: number; limit?: number; status?: TaskStatus }) => api.get<Task[]>('/tasks/assigned', params),
  list: (params: { page?: number; limit?: number; status?: TaskStatus }) => api.get<Task[]>('/tasks', params),
  create: (body: Record<string, unknown>) => api.post<Task>('/tasks', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Task>(`/tasks/${id}`, body),
}

export const projectApi = {
  list: (params: { page?: number; limit?: number; status?: ProjectStatus; search?: string }) => api.get<Project[]>('/projects', params),
  create: (body: Record<string, unknown>) => api.post<Project>('/projects', body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Project>(`/projects/${id}`, body),
}

export const leaveApi = {
  create: (body: { type: string; startDate: string; endDate: string; reason: string }) => api.post<Leave>('/leaves', body),
  list: (params: { page?: number; limit?: number; status?: LeaveStatus; userId?: string }) => api.get<Leave[]>('/leaves', params),
  pending: (params: { page?: number; limit?: number }) => api.get<Leave[]>('/leaves/pending', params),
  approve: (id: string) => api.post<Leave>(`/leaves/${id}/approve`),
  reject: (id: string, reason: string) => api.post<Leave>(`/leaves/${id}/reject`, { reason }),
  cancel: (id: string) => api.post<Leave>(`/leaves/${id}/cancel`),
}

export const holidayApi = {
  list: (year?: number) => api.get<{ year: number; rows: Holiday[] }>('/holidays', year ? { year } : undefined),
  create: (body: { name: string; date: string }) => api.post<Holiday>('/holidays', body),
  update: (id: string, body: { name?: string; date?: string }) => api.patch<Holiday>(`/holidays/${id}`, body),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/holidays/${id}`),
}

export const notificationApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: 'true' | 'false' }) => api.get<NotificationItem[]>('/notifications', params),
  unread: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all'),
}

export const reportApi = {
  attendance: (params: { from: string; to: string; userId?: string; page?: number; limit?: number }) =>
    api.get<{ from: string; to: string; rows: AttendanceReportRow[] }>('/reports/attendance', params),
  timesheets: (params: { year: number; month: number; userId?: string; page?: number; limit?: number }) =>
    api.get<{ year: number; month: number; rows: TimesheetReportRow[] }>('/reports/timesheets', params),
  leaves: (params: { year: number; userId?: string; page?: number; limit?: number }) =>
    api.get<{ year: number; rows: LeaveReportRow[] }>('/reports/leaves', params),
  audit: (params: { page?: number; limit?: number; entityType?: string; actorId?: string }) => api.get<AuditRow[]>('/reports/audit', params),
}
