import { LogOut } from 'lucide-react'
import { getTasks } from '@/lib/actions/tasks'
import { signOut } from '@/lib/actions/auth'
import { requireUser } from '@/lib/auth/dal'
import { TaskCard } from '@/components/tasks/task-card'
import { NewTaskButton } from '@/components/tasks/new-task-button'

export default async function DashboardPage() {
  const user = await requireUser()

  const tasks = await getTasks()

  const sorted = [...tasks].sort((a, b) => {
    if (!a.last_execution && !b.last_execution) return 0
    if (!a.last_execution) return -1
    if (!b.last_execution) return 1
    return (
      new Date(a.last_execution.executed_at).getTime() -
      new Date(b.last_execution.executed_at).getTime()
    )
  })

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">¿Cuánto hace de?</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <NewTaskButton />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-5xl">📋</p>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Sin tareas todavía</h2>
          <p className="mt-2 text-gray-500">
            Crea tu primera tarea periódica para empezar a registrarla.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
