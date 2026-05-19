'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ExecutionSchema = z.object({
  task_id: z.string().uuid(),
  executed_at: z.string().datetime({ offset: true }),
  note: z.string().max(500).trim().optional(),
})

export async function createExecution(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = ExecutionSchema.safeParse({
    task_id: formData.get('task_id'),
    executed_at: formData.get('executed_at'),
    note: formData.get('note') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Verify the task belongs to this user before inserting
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', parsed.data.task_id)
    .eq('user_id', user.id)
    .single()

  if (!task) return { error: { task_id: ['Task not found'] } }

  const { error } = await supabase.from('executions').insert({
    ...parsed.data,
    user_id: user.id,
  })

  if (error) return { error: { _: [error.message] } }

  revalidatePath('/')
  revalidatePath(`/tasks/${parsed.data.task_id}`)
  return { success: true }
}

export async function deleteExecution(id: string, taskId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('executions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}
