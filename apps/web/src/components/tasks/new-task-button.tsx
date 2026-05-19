'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TaskForm } from './task-form'

export function NewTaskButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="whitespace-nowrap">
        <Plus size={16} className="mr-1 flex-shrink-0" />
        <span className="hidden sm:inline">Nueva tarea</span>
        <span className="sm:hidden">Nueva</span>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea">
        <TaskForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  )
}
