import { NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Palmtree,
  Settings,
  Sun,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { initials, personName } from '@/lib/format'
import { useUnreadCount } from '@/hooks/queries'
import { useAuth } from '@/state/AuthProvider'
import { useTheme } from '@/state/ThemeProvider'
import type { Role } from '@/types/api'

type Item = { to: string; label: string; icon: LucideIcon; badge?: number }

const employeeNav: Item[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timesheet', label: 'Timesheet', icon: CalendarDays },
  { to: '/attendance', label: 'Attendance', icon: Timer },
  { to: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { to: '/leaves', label: 'Leave', icon: Palmtree },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: Users },
]

const managerNav: Item[] = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/team', label: 'Team', icon: Users },
  { to: '/manager/timesheets', label: 'Timesheets', icon: CalendarDays },
  { to: '/manager/approvals', label: 'Approvals', icon: ClipboardCheck },
  { to: '/manager/tasks', label: 'Tasks', icon: FolderKanban },
  { to: '/manager/leaves', label: 'Leave', icon: Palmtree },
  { to: '/manager/reports', label: 'Reports', icon: ChartColumn },
]

const adminNav: Item[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardCheck },
  { to: '/admin/holidays', label: 'Holidays', icon: Palmtree },
  { to: '/admin/leaves', label: 'Leave', icon: CalendarDays },
  { to: '/admin/attendance', label: 'Attendance', icon: Timer },
  { to: '/admin/timesheets', label: 'Timesheets', icon: CalendarDays },
  { to: '/admin/reports', label: 'Reports', icon: ChartColumn },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const personalNav: Item[] = [
  { to: '/timesheet', label: 'My timesheet', icon: CalendarDays },
  { to: '/attendance', label: 'My attendance', icon: Timer },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: Users },
]

function navFor(role: Role): { title: string; items: Item[] }[] {
  if (role === 'admin') return [
    { title: 'Organization', items: adminNav },
    { title: 'My work', items: personalNav },
  ]
  if (role === 'manager') return [
    { title: 'Team', items: managerNav },
    { title: 'My work', items: personalNav },
  ]
  return [{ title: 'Workspace', items: employeeNav }]
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const [open, setOpen] = useState(false)
  const name = personName(user)
  const groups = user ? navFor(user.role) : []
  const unreadCount = unread.data?.data.unreadCount ?? 0

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col bg-[#12161c] text-[#d7dde6] transition-transform lg:static lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center gap-3 px-5 pt-6 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/8">
              <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
                <path d="M6 21c2.4-6.4 5.4-9.6 10-9.6S23.6 14.6 26 21" fill="none" stroke="#e2b15a" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="16" cy="10.5" r="2.1" fill="#5dcec2" />
              </svg>
            </span>
            <div>
              <p className="font-display text-xl text-white">Meridian</p>
              <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">People operations</p>
            </div>
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-white/35 uppercase">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const showBadge = item.to.endsWith('/notifications') && unreadCount > 0
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition',
                            isActive ? 'bg-white text-[#12161c]' : 'text-white/70 hover:bg-white/7 hover:text-white',
                          )
                        }
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                        {showBadge ? (
                          <span className="rounded-full bg-[#0f6e66] px-2 py-0.5 text-[11px] font-semibold text-white">{unreadCount}</span>
                        ) : null}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/8 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {initials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
                <p className="truncate text-xs text-white/45">{profile?.designation ?? user?.role}</p>
              </div>
            </div>
          </div>
        </aside>
        {open ? <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/80 bg-canvas/85 px-4 py-3 backdrop-blur sm:px-8">
            <button className="rounded-full border border-line px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}>
              Menu
            </button>
            <p className="hidden text-sm text-muted sm:block">{profile?.department ?? 'Workspace'}</p>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink"
                onClick={toggle}
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-sm"
                onClick={() => {
                  void logout().then(() => navigate('/login'))
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
