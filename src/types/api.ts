export type Role = 'employee' | 'manager' | 'admin'
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type WorkType = 'assigned' | 'unassigned'
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high'
export type ProjectStatus = 'active' | 'archived'
export type EmploymentType = 'full_time' | 'part_time' | 'contract'
export type LockReason = 'weekend' | 'holiday' | 'leave' | 'future' | 'previous_month' | 'entry_window' | 'pending_approval' | 'approved'

export type EntryWindow = {
  timezone: string
  today: string
  yesterday: string
  openFrom: string
  openThrough: string
  message: string
}

export type PageMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  unreadCount?: number
}

export type UserSummary = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  role?: Role
  isActive?: boolean
  lastLoginAt?: string | null
}

export type EmployeeProfile = {
  id: string
  employeeCode: string
  department: string
  designation: string
  joiningDate: string
  employmentType: EmploymentType
  weeklyHours: number
  phone: string | null
  user: UserSummary | null
  manager: UserSummary | null
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
  lastLoginAt: string | null
}

export type LoginResult = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: string
  user: AuthUser
}

export type MeResult = {
  user: AuthUser
  profile: EmployeeProfile | null
}

export type Timesheet = {
  id: string
  userId: string
  year: number
  month: number
  status: TimesheetStatus
  totalMinutes: number
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  reviewedBy: { id: string; firstName: string; lastName: string } | null
}

export type TimeEntry = {
  id: string
  date: string
  workType: WorkType
  description: string
  startTime: string
  endTime: string
  durationMinutes: number
  project: { id: string; name: string; code: string } | null
  task: { id: string; title: string } | null
}

export type WeeklyTotal = {
  weekStart: string
  weekEnd: string
  totalMinutes: number
}

export type CalendarDay = {
  date: string
  weekday: number
  isWeekend: boolean
  isHoliday: boolean
  holidayName: string | null
  isOnLeave: boolean
  leaveType: LeaveType | null
  isFuture: boolean
  isPreviousMonth: boolean
  isFillable: boolean
  lockReasons: LockReason[]
  totalMinutes: number
  entryCount: number
  attendance: Attendance | null
}

export type MonthCalendar = {
  year: number
  month: number
  today: string
  entryWindow: EntryWindow
  timesheet: Timesheet | null
  dailyTotals: { date: string; totalMinutes: number }[]
  weeklyTotals: WeeklyTotal[]
  monthlyTotalMinutes: number
  days: CalendarDay[]
}

export type DailyTimesheet = {
  date: string
  isFillable: boolean
  lockReasons: LockReason[]
  entryWindow: EntryWindow
  timesheet: Timesheet | null
  entries: TimeEntry[]
  totalMinutes: number
}

export type PendingTimesheet = Timesheet & {
  employee: (UserSummary & { employeeCode: string | null }) | null
}

export type Attendance = {
  id: string
  userId: string
  date: string
  status: 'checked_in' | 'checked_out'
  checkInAt: string
  checkOutAt: string | null
  workMinutes: number | null
  notes: string | null
  platform: 'web' | 'mobile' | 'unknown'
}

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  estimatedMinutes: number | null
  project: { id: string; name?: string; code?: string }
  assignedTo: UserSummary
  assignedBy: UserSummary
  createdAt: string | null
  updatedAt: string | null
}

export type Project = {
  id: string
  name: string
  code: string
  description: string
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  manager: UserSummary
  members: UserSummary[]
}

export type Leave = {
  id: string
  type: LeaveType
  startDate: string
  endDate: string
  dayCount: number
  reason: string
  status: LeaveStatus
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string | null
  user: UserSummary
  reviewedBy: { id: string; firstName: string; lastName: string } | null
}

export type Holiday = {
  id: string
  name: string
  date: string
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type ReportIdentity = {
  userId: string
  name: string
  email: string
  employeeCode: string | null
}

export type AttendanceReportRow = ReportIdentity & {
  totalWorkMinutes: number
  daysPresent: number
  days?: Attendance[]
}

export type TimesheetReportRow = ReportIdentity & {
  status: TimesheetStatus | null
  monthlyTotalMinutes: number
  weeklyTotals: WeeklyTotal[]
}

export type LeaveReportRow = ReportIdentity & {
  approvedDays: number
  pendingDays: number
  byType: Record<LeaveType, number>
}

export type AuditRow = {
  id: string
  action: string
  entityType: string
  entityId: string
  before: unknown
  after: unknown
  ip: string | null
  userAgent: string | null
  createdAt: string
  actor: UserSummary | null
}

export type EntryPayload =
  | {
      workType: 'assigned'
      taskId: string
      date: string
      startTime: string
      endTime: string
      description: string
    }
  | {
      workType: 'unassigned'
      projectId?: string
      date: string
      startTime: string
      endTime: string
      description: string
    }
