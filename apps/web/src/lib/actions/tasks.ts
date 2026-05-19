'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { TaskWithStats } from '@cuantohacede/types'

const TaskSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(10).optional(),
  interval_days: z.coerce.number().int().min(1).max(3650).optional().nullable(),
})

export async function getTasks(): Promise<TaskWithStats[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      executions (
        id,
        executed_at,
        note,
        created_at
      )
    `
    )
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((task) => {
    const executions = (task.executions ?? []).sort(
      (a: { executed_at: string }, b: { executed_at: string }) =>
        new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
    )

    const lastExecution = executions[0] ?? null
    const count = executions.length

    let avgInterval: number | null = null
    if (count >= 2) {
      const intervals: number[] = []
      for (let i = 0; i < executions.length - 1; i++) {
        const diff =
          (new Date(executions[i].executed_at).getTime() -
            new Date(executions[i + 1].executed_at).getTime()) /
          (1000 * 60 * 60 * 24)
        intervals.push(diff)
      }
      avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    }

    return {
      ...task,
      last_execution: lastExecution,
      execution_count: count,
      average_interval_days: avgInterval,
    } as TaskWithStats
  })
}

export async function getTask(id: string): Promise<TaskWithStats> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      executions (
        id,
        executed_at,
        note,
        created_at,
        task_id,
        user_id
      )
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) redirect('/')

  const executions = (data.executions ?? []).sort(
    (a: { executed_at: string }, b: { executed_at: string }) =>
      new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
  )

  const lastExecution = executions[0] ?? null
  const count = executions.length

  let avgInterval: number | null = null
  if (count >= 2) {
    const intervals: number[] = []
    for (let i = 0; i < executions.length - 1; i++) {
      const diff =
        (new Date(executions[i].executed_at).getTime() -
          new Date(executions[i + 1].executed_at).getTime()) /
        (1000 * 60 * 60 * 24)
      intervals.push(diff)
    }
    avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
  }

  return {
    ...data,
    last_execution: lastExecution,
    execution_count: count,
    average_interval_days: avgInterval,
  } as TaskWithStats
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = TaskSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
    icon: formData.get('icon') || undefined,
    interval_days: formData.get('interval_days') || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from('tasks').insert({
    ...parsed.data,
    user_id: user.id,
  })

  if (error) return { error: { _: [error.message] } }

  revalidatePath('/')
  return { success: true }
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = TaskSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
    icon: formData.get('icon') || undefined,
    interval_days: formData.get('interval_days') || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: { _: [error.message] } }

  revalidatePath('/')
  revalidatePath(`/tasks/${id}`)
  return { success: true }
}

export async function archiveTask(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('tasks')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
