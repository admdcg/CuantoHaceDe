import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'session'

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

export interface SessionPayload {
  userId: string
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET debe existir y tener al menos 32 caracteres')
  }
  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

/**
 * Devuelve el contenido de la sesión, o null si el token falta, está caducado
 * o la firma no cuadra. Nunca lanza: quien la llama trata el null como
 * "no autenticado".
 *
 * Este módulo no toca next/headers a propósito, para que pueda importarse
 * desde el proxy además de desde el servidor.
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    return typeof payload.userId === 'string' ? { userId: payload.userId } : null
  } catch {
    return null
  }
}
