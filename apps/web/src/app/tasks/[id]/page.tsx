import { ArrowLeft, Calendar, TrendingUp, Hash } from 'lucide-react'
import Link from 'next/link'
import { getTask } from '@/lib/actions/tasks'
import { timeAgo, daysSince, formatInterval } from '@/lib/utils'
import { differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExecutionRow } from '@/components/executions/execution-row'
import { TaskEditButton } from '@/components/tasks/task-edit-button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const task = await getTask(id)

  const executions = task.last_execution
    ? [...(task as any).executions].sort(
        (a: { executed_at: string }, b: { executed_at: string }) =>
          new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      )
    : []

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-1 items-center gap-3">
          <span className="text-3xl">{task.icon ?? '📋'}</span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">{task.name}</h1>
            {task.description && (
              <p className="truncate text-sm text-gray-500">{task.description}</p>
            )}
          </div>
        </div>
        <TaskEditButton task={task} />
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <Calendar size={18} className="mx-auto mb-1 text-indigo-500" />
          <p className="text-2xl font-bold text-gray-900">
            {task.last_execution ? daysSince(task.last_execution.executed_at) : '—'}
          </p>
          <p className="text-xs text-gray-500">días desde última</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <Hash size={18} className="mx-auto mb-1 text-indigo-500" />
          <p className="text-2xl font-bold text-gray-900">{task.execution_count}</p>
          <p className="text-xs text-gray-500">veces registrada</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <TrendingUp size={18} className="mx-auto mb-1 text-indigo-500" />
          <p className="text-2xl font-bold text-gray-900">
            {task.average_interval_days ?? '—'}
          </p>
          <p className="text-xs text-gray-500">días de media</p>
        </div>
      </div>

      {task.interval_days && (
        <p className="mb-4 text-sm text-gray-500">
          Intervalo esperado: {formatInterval(task.interval_days)}
        </p>
      )}

      {/* History */}
      <section>
        <h2 className="mb-3 font-semibold text-gray-700">Historial</h2>
        {executions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aún no hay registros.</p>
        ) : (
          <ul className="space-y-2">
            {executions.map((exec: any, i: number) => {
              const prevExec = executions[i + 1]
              const gap = prevExec
                ? differenceInDays(parseISO(exec.executed_at), parseISO(prevExec.executed_at))
                : null

              return (
                <li key={exec.id}>
                  <ExecutionRow execution={exec} taskId={task.id} gapDays={gap} />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
