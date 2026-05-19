'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { CATEGORIES, getCategory, type CategoryId } from '@/lib/categories'
import type { Task } from '@cuantohacede/types'

type Step = 'category' | 'template' | 'form'
type FieldErrors = Record<string, string[] | undefined>

interface TaskFormProps {
  task?: Task
  onSuccess?: () => void
}

export function TaskForm({ task, onSuccess }: TaskFormProps) {
  const isEditing = !!task
  const [step, setStep] = useState<Step>(isEditing ? 'form' : 'category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(
    (task?.category as CategoryId) ?? 'other'
  )
  const [taskName, setTaskName] = useState(task?.name ?? '')
  const [intervalDays, setIntervalDays] = useState<string>(
    task?.interval_days ? String(task.interval_days) : ''
  )
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldErrors>({})

  const category = getCategory(selectedCategory)

  function handleCategorySelect(id: CategoryId) {
    setSelectedCategory(id)
    setStep('template')
  }

  function handleTemplateSelect(name: string, interval: number) {
    setTaskName(name)
    setIntervalDays(String(interval))
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    formData.set('category', selectedCategory)

    startTransition(async () => {
      const result = isEditing
        ? await updateTask(task.id, formData)
        : await createTask(formData)

      if (result?.error) {
        setErrors(result.error as FieldErrors)
      } else {
        onSuccess?.()
      }
    })
  }

  // Step 1: choose category
  if (step === 'category') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">¿A qué área pertenece esta tarea?</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm active:scale-95"
              style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-800">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: choose template or custom
  if (step === 'template') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setStep('category')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={14} />
          {category.label}
        </button>

        <p className="text-sm text-gray-500">Elige una tarea frecuente o escribe la tuya:</p>

        <div className="space-y-1.5">
          {category.templates.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => handleTemplateSelect(tpl.name, tpl.interval_days)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="text-sm font-medium text-gray-800">{tpl.name}</span>
              <span className="text-xs text-gray-400">
                {tpl.interval_days < 7
                  ? `${tpl.interval_days}d`
                  : tpl.interval_days < 30
                  ? `${Math.round(tpl.interval_days / 7)}sem`
                  : tpl.interval_days < 365
                  ? `${Math.round(tpl.interval_days / 30)}m`
                  : `${Math.round(tpl.interval_days / 365)}a`}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => { setTaskName(''); setStep('form') }}
          className="w-full rounded-lg border-2 border-dashed border-gray-200 py-2.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600"
        >
          + Nombre personalizado
        </button>
      </div>
    )
  }

  // Step 3: form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <button
          type="button"
          onClick={() => setStep('template')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={14} />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.icon} {category.label}
          </span>
        </button>
      )}

      {isEditing && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.icon} {category.label}
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Nombre de la tarea"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Ej: Cortarme el pelo"
        error={errors.name?.[0]}
        required
        autoFocus
      />

      <Input
        id="description"
        name="description"
        label="Nota (opcional)"
        defaultValue={task?.description ?? ''}
        placeholder="Cualquier detalle adicional..."
        error={errors.description?.[0]}
      />

      <div className="space-y-1">
        <label htmlFor="interval_days" className="block text-sm font-medium text-gray-700">
          Hacerlo cada (días)
        </label>
        <input
          id="interval_days"
          name="interval_days"
          type="number"
          min="1"
          max="3650"
          value={intervalDays}
          onChange={(e) => setIntervalDays(e.target.value)}
          placeholder="Ej: 21"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-400">Opcional. Se usa para el indicador de urgencia.</p>
        {errors.interval_days && (
          <p className="text-xs text-red-600">{errors.interval_days[0]}</p>
        )}
      </div>

      {errors._ && <p className="text-sm text-red-600">{errors._[0]}</p>}

      <Button type="submit" loading={isPending} className="w-full">
        {isEditing ? 'Guardar cambios' : 'Crear tarea'}
      </Button>
    </form>
  )
}
