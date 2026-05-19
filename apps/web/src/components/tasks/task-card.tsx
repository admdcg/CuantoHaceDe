'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ChevronRight, Clock } from 'lucide-react'
import { cn, timeAgo, daysSince, urgencyLevel, formatInterval } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ExecutionModal } from '@/components/executions/execution-modal'
import type { TaskWithStats } from '@cuantohacede/types'

interface TaskCardProps {
  task: TaskWithStats
}

const urgencyStyles = {
  none: 'border-gray-200 bg-white',
  ok: 'border-green-100 bg-green-50',
  warning: 'border-yellow-100 bg-yellow-50',
  overdue: 'border-red-100 bg-red-50',
}

const urgencyDotStyles = {
  none: 'bg-gray-300',
  ok: 'bg-green-500',
  warning: 'bg-yellow-500',
  overdue: 'bg-red-500',
}

export function TaskCard({ task }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false)
  const urgency = urgencyLevel(task.last_execution?.executed_at ?? null, task.interval_days)
  const days = task.last_execution ? daysSince(task.last_execution.executed_at) : null

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-sm',
          urgencyStyles[urgency]
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: task.color ? `${task.color}20` : undefined }}>
          {task.icon ?? '📋'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', urgencyDotStyles[urgency])} />
            <h3 className="truncate font-semibold text-gray-900">{task.name}</h3>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
            {task.last_execution ? (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                hace {days === 0 ? 'menos de un día' : `${days} día${days === 1 ? '' : 's'}`}
              </span>
            ) : (
              <span className="text-gray-400">Sin registros</span>
            )}
            {task.interval_days && (
              <span className="text-gray-400">· {formatInterval(task.interval_days)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowModal(true)}
            aria-label={`Marcar ${task.name} como hecha`}
          >
            <CheckCircle size={16} className="mr-1" />
            Hecho
          </Button>
          <Link
            href={`/tasks/${task.id}`}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Ver historial de ${task.name}`}
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <ExecutionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        taskId={task.id}
        taskName={task.name}
      />
    </>
  )
}
