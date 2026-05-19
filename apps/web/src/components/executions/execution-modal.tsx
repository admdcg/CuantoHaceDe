'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createExecution } from '@/lib/actions/executions'

interface ExecutionModalProps {
  open: boolean
  onClose: () => void
  taskId: string
  taskName: string
}

export function ExecutionModal({ open, onClose, taskId, taskName }: ExecutionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Default to now, formatted for datetime-local input
  const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Convert datetime-local to ISO with timezone
    const localDt = formData.get('executed_at') as string
    const isoDate = new Date(localDt).toISOString()
    formData.set('executed_at', isoDate)
    formData.set('task_id', taskId)

    startTransition(async () => {
      const result = await createExecution(formData)

      if (result?.error) {
        const firstError = Object.values(result.error).flat()[0]
        setError(firstError ?? 'Error al guardar')
      } else {
        onClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`Marcar como hecha: ${taskName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="executed_at" className="block text-sm font-medium text-gray-700">
            ¿Cuándo?
          </label>
          <input
            id="executed_at"
            name="executed_at"
            type="datetime-local"
            defaultValue={nowLocal}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <Input
          id="note"
          name="note"
          label="Nota (opcional)"
          placeholder="Ej: En la barbería de Juan"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={isPending} className="flex-1">
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
