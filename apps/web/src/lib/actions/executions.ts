'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withUser } from '@/lib/db'
import { requireUser } from '@/lib/auth/dal'

const ExecutionSchema = z.object({
  task_id: z.uuid(),
  executed_at: z.iso.datetime({ offset: true }),
  note: z.string().max(500).trim().optional(),
})

export async function createExecution(formData: FormData) {
  const user = await requireUser()

  const parsed = ExecutionSchema.safeParse({
    task_id: formData.get('task_id'),
    executed_at: formData.get('executed_at'),
    note: formData.get('note') || undefined,
  })

  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors }
  }

  const { task_id, executed_at, note } = parsed.data

  const inserted = await withUser(user.id, async (client) => {
    // La tarea tiene que ser de este usuario antes de colgarle una ejecución.
    const { rows } = await client.query('select 1 from public.tasks where id = $1 and user_id = $2', [
      task_id,
      user.id,
    ])

    if (rows.length === 0) return false

    await client.query(
      `insert into public.executions (task_id, user_id, executed_at, note)
       values ($1, $2, $3, $4)`,
      [task_id, user.id, executed_at, note ?? null]
    )

    return true
  })

  if (!inserted) return { error: { task_id: ['Task not found'] } }

  revalidatePath('/')
  revalidatePath(`/tasks/${task_id}`)
  return { success: true }
}

export async function deleteExecution(id: string, taskId: string) {
  const user = await requireUser()

  const { rowCount } = await withUser(user.id, (client) =>
    client.query('delete from public.executions where id = $1 and user_id = $2', [id, user.id])
  )

  if (rowCount === 0) return { error: 'Registro no encontrado' }

  revalidatePath('/')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}
