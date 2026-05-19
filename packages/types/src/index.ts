export interface User {
  id: string
  email: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  interval_days: number | null
  archived: boolean
  created_at: string
  updated_at: string
  // computed from joins
  last_execution?: Execution | null
  execution_count?: number
}

export interface Execution {
  id: string
  task_id: string
  user_id: string
  executed_at: string
  note: string | null
  created_at: string
}

export interface TaskWithStats extends Task {
  last_execution: Execution | null
  execution_count: number
  average_interval_days: number | null
}

export type CreateTaskInput = Pick<Task, 'name'> &
  Partial<Pick<Task, 'description' | 'color' | 'icon' | 'interval_days'>>

export type UpdateTaskInput = Partial<CreateTaskInput & Pick<Task, 'archived'>>

export type CreateExecutionInput = {
  task_id: string
  executed_at: string
  note?: string
}
