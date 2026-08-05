'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { withUser } from '@/lib/db'
import { requireUser } from '@/lib/auth/dal'
import type { Execution, Task, TaskWithStats } from '@cuantohacede/types'

const VALID_CATEGORIES = [
  'hygiene',
  'health',
  'home',
  'car',
  'work',
  'pets',
  'finances',
  'other',
] as const

const TaskSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  category: z.enum(VALID_CATEGORIES).default('other'),
  interval_days: z.coerce.number().int().min(1).max(3650).optional().nullable(),
})

const TASK_COLUMNS = `
  id, user_id, name, description, category, interval_days, archived, created_at, updated_at
`
const EXECUTION_COLUMNS = `
  id, task_id, user_id, executed_at, note, created_at
`

type TaskWithExecutions = TaskWithStats & { executions: Execution[] }

/** Lee el formulario de tarea. El formulario fija category en task-form.tsx. */
function parseTaskForm(formData: FormData) {
  return TaskSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category') || undefined,
    interval_days: formData.get('interval_days') || null,
  })
}

/**
 * Añade a la tarea las estadísticas derivadas del historial. Espera las
 * ejecuciones ya ordenadas de más reciente a más antigua.
 */
function withStats(task: Task, executions: Execution[]): TaskWithExecutions {
  let averageIntervalDays: number | null = null

  if (executions.length >= 2) {
    const intervals: number[] = []
    for (let i = 0; i < executions.length - 1; i++) {
      const diff =
        (new Date(executions[i].executed_at).getTime() -
          new Date(executions[i + 1].executed_at).getTime()) /
        (1000 * 60 * 60 * 24)
      intervals.push(diff)
    }
    averageIntervalDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
  }

  return {
    ...task,
    executions,
    last_execution: executions[0] ?? null,
    execution_count: executions.length,
    average_interval_days: averageIntervalDays,
  }
}

export async function getTasks(): Promise<TaskWithStats[]> {
  const user = await requireUser()

  return withUser(user.id, async (client) => {
    const { rows: tasks } = await client.query<Task>(
      `select ${TASK_COLUMNS}
         from public.tasks
        where user_id = $1 and archived = false
        order by created_at desc`,
      [user.id]
    )

    if (tasks.length === 0) return []

    const { rows: executions } = await client.query<Execution>(
      `select ${EXECUTION_COLUMNS}
         from public.executions
        where user_id = $1 and task_id = any($2::uuid[])
        order by executed_at desc`,
      [user.id, tasks.map((task) => task.id)]
    )

    const byTask = new Map<string, Execution[]>()
    for (const execution of executions) {
      const list = byTask.get(execution.task_id)
      if (list) list.push(execution)
      else byTask.set(execution.task_id, [execution])
    }

    return tasks.map((task) => withStats(task, byTask.get(task.id) ?? []))
  })
}

export async function getTask(id: string): Promise<TaskWithStats> {
  const user = await requireUser()

  const task = await withUser(user.id, async (client) => {
    const { rows } = await client.query<Task>(
      `select ${TASK_COLUMNS} from public.tasks where id = $1 and user_id = $2`,
      [id, user.id]
    )

    if (rows.length === 0) return null

    const { rows: executions } = await client.query<Execution>(
      `select ${EXECUTION_COLUMNS}
         from public.executions
        where task_id = $1 and user_id = $2
        order by executed_at desc`,
      [id, user.id]
    )

    return withStats(rows[0], executions)
  })

  if (!task) redirect('/')

  return task
}

export async function createTask(formData: FormData) {
  const user = await requireUser()

  const parsed = parseTaskForm(formData)
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors }
  }

  const { name, description, category, interval_days } = parsed.data

  await withUser(user.id, (client) =>
    client.query(
      `insert into public.tasks (user_id, name, description, category, interval_days)
       values ($1, $2, $3, $4, $5)`,
      [user.id, name, description ?? null, category, interval_days ?? null]
    )
  )

  revalidatePath('/')
  return { success: true }
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser()

  const parsed = parseTaskForm(formData)
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors }
  }

  const { name, description, category, interval_days } = parsed.data

  const { rowCount } = await withUser(user.id, (client) =>
    client.query(
      `update public.tasks
          set name = $1, description = $2, category = $3, interval_days = $4
        where id = $5 and user_id = $6`,
      [name, description ?? null, category, interval_days ?? null, id, user.id]
    )
  )

  if (rowCount === 0) return { error: { _: ['Tarea no encontrada'] } }

  revalidatePath('/')
  revalidatePath(`/tasks/${id}`)
  return { success: true }
}

export async function archiveTask(id: string) {
  const user = await requireUser()

  const { rowCount } = await withUser(user.id, (client) =>
    client.query('update public.tasks set archived = true where id = $1 and user_id = $2', [
      id,
      user.id,
    ])
  )

  if (rowCount === 0) return { error: 'Tarea no encontrada' }

  revalidatePath('/')
  return { success: true }
}
