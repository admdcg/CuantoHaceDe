'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { query } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, deleteSession } from '@/lib/auth/session'

export type AuthState = { error: string } | null

const Credentials = z.object({
  email: z.email('Email no válido').max(254).trim().toLowerCase(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(200),
})

const UNIQUE_VIOLATION = '23505'

function parse(formData: FormData) {
  return Credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos' }
  }

  const { email, password } = parsed.data
  const passwordHash = await hashPassword(password)

  let userId: string
  try {
    const { rows } = await query<{ id: string }>(
      'insert into public.users (email, password_hash) values ($1, $2) returning id',
      [email, passwordHash]
    )
    userId = rows[0].id
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        return { error: 'Ese email ya está registrado' }
      }
    }
    throw error
  }

  await createSession(userId)
  redirect('/')
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: 'Email o contraseña incorrectos' }
  }

  const { email, password } = parsed.data

  const { rows } = await query<{ id: string; password_hash: string }>(
    'select id, password_hash from public.users where email = $1',
    [email]
  )
  const user = rows[0]

  if (!user) {
    // Se calcula un hash igualmente para que un email inexistente no responda
    // antes que uno existente y permita enumerarlos por tiempos.
    await hashPassword(password)
    return { error: 'Email o contraseña incorrectos' }
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    return { error: 'Email o contraseña incorrectos' }
  }

  await createSession(user.id)
  redirect('/')
}

export async function signOut(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
