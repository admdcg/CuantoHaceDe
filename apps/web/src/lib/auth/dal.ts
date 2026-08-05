import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { decrypt, SESSION_COOKIE } from '@/lib/auth/token'

export interface SessionUser {
  id: string
  email: string
}

/**
 * Comprobación autoritativa de sesión, la que vale. El proxy solo mira la
 * cookie de forma optimista; toda lectura o escritura de datos pasa por aquí.
 *
 * cache() la memoiza dentro de un mismo render, así que varias llamadas en la
 * misma petición no repiten la consulta.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const session = await decrypt(cookieStore.get(SESSION_COOKIE)?.value)

  if (!session) return null

  // El usuario puede haberse borrado con la cookie todavía viva.
  const { rows } = await query<SessionUser>('select id, email from public.users where id = $1', [
    session.userId,
  ])

  return rows[0] ?? null
})

/** Igual que getSessionUser, pero corta el paso a /login si no hay sesión. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}
