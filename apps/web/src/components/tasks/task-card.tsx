'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ChevronRight, Clock } from 'lucide-react'
import { cn, daysSince, urgencyLevel, formatInterval } from '@/lib/utils'
import { getCategory } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { ExecutionModal } from '@/components/executions/execution-modal'
import type { TaskWithStats } from '@cuantohacede/types'

interface TaskCardProps {
  task: TaskWithStats
}

const urgencyRing = {
  none: 'border-gray-200',
  ok: 'border-l-4',
  warning: 'border-l-4',
  overdue: 'border-l-4',
}

export function TaskCard({ task }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false)
  const category = getCategory(task.category)
  const urgency = urgencyLevel(task.last_execution?.executed_at ?? null, task.interval_days)
  const days = task.last_execution ? daysSince(task.last_execution.executed_at) : null

  const urgencyColor = {
    none: '#d1d5db',
    ok: category.color,
    warning: '#f59e0b',
    overdue: '#ef4444',
  }[urgency]

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
        style={{ borderLeftColor: urgencyColor, borderLeftWidth: 4 }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: `${category.color}18` }}
        >
          {category.icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">{task.name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
            {task.last_execution ? (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {days === 0 ? 'hoy' : `hace ${days}d`}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Sin registros</span>
            )}
            {task.interval_days && (
              <span className="text-gray-300">·</span>
            )}
            {task.interval_days && (
              <span className="text-xs text-gray-400">{formatInterval(task.interval_days)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowModal(true)}
            aria-label={`Marcar ${task.name} como hecha`}
          >
            <CheckCircle size={15} className="mr-1" />
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
