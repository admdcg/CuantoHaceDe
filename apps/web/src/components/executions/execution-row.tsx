'use client'

import { useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, ArrowDown } from 'lucide-react'
import { deleteExecution } from '@/lib/actions/executions'

interface ExecutionRowProps {
  execution: {
    id: string
    executed_at: string
    note: string | null
  }
  taskId: string
  gapDays: number | null
}

export function ExecutionRow({ execution, taskId, gapDays }: ExecutionRowProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('¿Eliminar este registro?')) return
    startTransition(async () => {
      await deleteExecution(execution.id, taskId)
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {format(parseISO(execution.executed_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
          </p>
          {execution.note && (
            <p className="truncate text-xs text-gray-500">{execution.note}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Eliminar registro"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {gapDays !== null && (
        <div className="flex items-center gap-1 pl-4 text-xs text-gray-400">
          <ArrowDown size={12} />
          <span>{gapDays} días desde el anterior</span>
        </div>
      )}
    </div>
  )
}
