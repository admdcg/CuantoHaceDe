'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createTask, updateTask } from '@/lib/actions/tasks'
import type { Task } from '@cuantohacede/types'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
const ICONS = ['📋', '💇', '🏃', '🧹', '💊', '🚗', '🐾', '🌱', '💻', '📚', '🍳', '🛒']

interface TaskFormProps {
  task?: Task
  onSuccess?: () => void
}

type FieldErrors = Record<string, string[] | undefined>

export function TaskForm({ task, onSuccess }: TaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [selectedColor, setSelectedColor] = useState(task?.color ?? '#6366f1')
  const [selectedIcon, setSelectedIcon] = useState(task?.icon ?? '📋')

  async function handleSubmit(formData: FormData) {
    formData.set('color', selectedColor)
    formData.set('icon', selectedIcon)

    startTransition(async () => {
      const result = task
        ? await updateTask(task.id, formData)
        : await createTask(formData)

      if (result?.error) {
        setErrors(result.error as FieldErrors)
      } else {
        setErrors({})
        onSuccess?.()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        id="name"
        name="name"
        label="Nombre de la tarea"
        defaultValue={task?.name}
        placeholder="Ej: Cortarme el pelo"
        error={errors.name?.[0]}
        required
        autoFocus
      />

      <Input
        id="description"
        name="description"
        label="Descripción (opcional)"
        defaultValue={task?.description ?? ''}
        placeholder="Notas adicionales..."
        error={errors.description?.[0]}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Intervalo esperado (días)</label>
        <input
          id="interval_days"
          name="interval_days"
          type="number"
          min="1"
          max="3650"
          defaultValue={task?.interval_days ?? ''}
          placeholder="Ej: 21 (cada 3 semanas)"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.interval_days && (
          <p className="text-xs text-red-600">{errors.interval_days[0]}</p>
        )}
        <p className="text-xs text-gray-400">Opcional. Se usa para calcular urgencia.</p>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">Icono</span>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
                selectedIcon === icon
                  ? 'bg-indigo-100 ring-2 ring-indigo-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">Color</span>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`h-7 w-7 rounded-full transition-transform ${
                selectedColor === color ? 'scale-125 ring-2 ring-offset-1' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </div>

      {errors._ && <p className="text-sm text-red-600">{errors._[0]}</p>}

      <Button type="submit" loading={isPending} className="w-full">
        {task ? 'Guardar cambios' : 'Crear tarea'}
      </Button>
    </form>
  )
}
