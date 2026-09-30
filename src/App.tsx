import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { LeaveBoard } from '@/components/leave/LeaveBoard'
import { AppShell } from '@/components/layout/AppShell'
import { ReportsView } from '@/components/reports/ReportsView'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TimesheetReview } from '@/components/timesheet/TimesheetReview'
import { ScreenLoader } from '@/components/ui/primitives'
import { AdminAttendancePage } from '@/pages/admin/AdminAttendancePage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage'
import { EmployeesPage } from '@/pages/admin/EmployeesPage'
import { HolidaysPage } from '@/pages/admin/HolidaysPage'
import { ProjectsPage } from '@/pages/admin/ProjectsPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AttendancePage } from '@/pages/employee/AttendancePage'
import { EmployeeDashboardPage } from '@/pages/employee/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ApprovalsPage } from '@/pages/manager/ApprovalsPage'
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage'
import { TeamPage } from '@/pages/manager/TeamPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { TimesheetPage } from '@/pages/TimesheetPage'
import { homeForRole } from '@/lib/roles'
import { useAuth } from '@/state/AuthProvider'
import type { Role } from '@/types/api'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false
        return count < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})

function Guard({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { status, user } = useAuth()
  if (status === 'loading') return <ScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />
  return <AppShell>{children}</AppShell>
}

function HomeRedirect() {
  const { status, user } = useAuth()
  if (status === 'loading') return <ScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Guard roles={['employee']}><EmployeeDashboardPage /></Guard>} />
          <Route path="/timesheet" element={<Guard><TimesheetPage /></Guard>} />
          <Route path="/attendance" element={<Guard><AttendancePage /></Guard>} />
          <Route path="/tasks" element={<Guard><TaskBoard mode="self" /></Guard>} />
          <Route path="/leaves" element={<Guard><LeaveBoard mode="self" /></Guard>} />
          <Route path="/notifications" element={<Guard><NotificationsPage /></Guard>} />
          <Route path="/profile" element={<Guard><ProfilePage /></Guard>} />
          <Route path="/manager/dashboard" element={<Guard roles={['manager']}><ManagerDashboardPage /></Guard>} />
          <Route path="/manager/team" element={<Guard roles={['manager']}><TeamPage /></Guard>} />
          <Route path="/manager/timesheets" element={<Guard roles={['manager']}><TimesheetReview /></Guard>} />
          <Route path="/manager/approvals" element={<Guard roles={['manager']}><ApprovalsPage /></Guard>} />
          <Route path="/manager/tasks" element={<Guard roles={['manager']}><TaskBoard mode="manage" /></Guard>} />
          <Route path="/manager/leaves" element={<Guard roles={['manager']}><LeaveBoard mode="review" /></Guard>} />
          <Route path="/manager/reports" element={<Guard roles={['manager']}><ReportsView showAudit={false} /></Guard>} />
          <Route path="/admin/dashboard" element={<Guard roles={['admin']}><AdminDashboardPage /></Guard>} />
          <Route path="/admin/employees" element={<Guard roles={['admin']}><EmployeesPage /></Guard>} />
          <Route path="/admin/departments" element={<Guard roles={['admin']}><DepartmentsPage /></Guard>} />
          <Route path="/admin/projects" element={<Guard roles={['admin']}><ProjectsPage /></Guard>} />
          <Route path="/admin/tasks" element={<Guard roles={['admin']}><TaskBoard mode="manage" /></Guard>} />
          <Route path="/admin/holidays" element={<Guard roles={['admin']}><HolidaysPage /></Guard>} />
          <Route path="/admin/leaves" element={<Guard roles={['admin']}><LeaveBoard mode="review" /></Guard>} />
          <Route path="/admin/attendance" element={<Guard roles={['admin']}><AdminAttendancePage /></Guard>} />
          <Route path="/admin/timesheets" element={<Guard roles={['admin']}><TimesheetReview /></Guard>} />
          <Route path="/admin/reports" element={<Guard roles={['admin']}><ReportsView showAudit /></Guard>} />
          <Route path="/admin/settings" element={<Guard roles={['admin']}><SettingsPage /></Guard>} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
