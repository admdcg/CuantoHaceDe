'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { TaskForm } from './task-form'
import type { Task } from '@cuantohacede/types'

interface TaskEditButtonProps {
  task: Task
}

export function TaskEditButton({ task }: TaskEditButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Editar tarea"
      >
        <Settings size={20} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar tarea">
        <TaskForm task={task} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}
