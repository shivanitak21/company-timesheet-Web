import { z } from 'zod'

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date')

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/\d/, 'Include a number')

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(72),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(72),
  newPassword: passwordSchema,
})

export const entrySchema = z
  .object({
    workType: z.enum(['assigned', 'unassigned']),
    taskId: z.string().optional(),
    projectId: z.string().optional(),
    startTime: timeSchema,
    endTime: timeSchema,
    description: z.string().trim().min(1, 'Add a short description').max(1000),
  })
  .superRefine((value, ctx) => {
    if (value.workType === 'assigned' && !value.taskId) {
      ctx.addIssue({ code: 'custom', path: ['taskId'], message: 'Select an assigned task' })
    }
    const [sh, sm] = value.startTime.split(':').map(Number)
    const [eh, em] = value.endTime.split(':').map(Number)
    if (eh * 60 + em <= sh * 60 + sm) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
    }
  })

export const leaveSchema = z
  .object({
    type: z.enum(['annual', 'sick', 'unpaid', 'other']),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: z.string().trim().min(3, 'Add a reason').max(1000),
  })
  .refine((value) => value.startDate <= value.endDate, { path: ['endDate'], message: 'End date must be on or after the start date' })

export const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Add a short reason').max(500),
})

export const holidaySchema = z.object({
  name: z.string().trim().min(2).max(120),
  date: dateSchema,
})

export const taskSchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  assignedTo: z.string().min(1, 'Select an assignee'),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  estimatedMinutes: z.string().optional(),
})

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, _ and - only'),
  description: z.string().trim().max(2000).optional(),
  managerId: z.string().min(1, 'Select a manager'),
  memberIds: z.array(z.string()).max(200),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'archived']),
})

export const employeeCreateSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum(['employee', 'manager', 'admin']),
  employeeCode: z.string().trim().max(20).optional(),
  department: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(80).optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract']).optional(),
  weeklyHours: z.string().optional(),
  phone: z.string().trim().max(30).optional(),
  managerId: z.string().optional(),
})

export const profilePhoneSchema = z.object({
  phone: z.string().trim().max(30),
})

export type LoginValues = z.infer<typeof loginSchema>
export type EntryValues = z.infer<typeof entrySchema>
export type LeaveValues = z.infer<typeof leaveSchema>
export type TaskValues = z.infer<typeof taskSchema>
export type ProjectValues = z.infer<typeof projectSchema>
export type EmployeeCreateValues = z.infer<typeof employeeCreateSchema>
