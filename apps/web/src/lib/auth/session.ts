import { cookies } from 'next/headers'
import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/token'

export async function createSession(userId: string): Promise<void> {
  const token = await encrypt({ userId })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
