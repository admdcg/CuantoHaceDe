// @vitest-environment node
//
// jose comprueba `instanceof Uint8Array` sobre lo que devuelve TextEncoder, y
// en jsdom ese objeto viene de otro realm, así que la comprobación falla aunque
// el código sea correcto. En producción esto corre en Node, no en un navegador.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'

const SECRET = 'clave-de-pruebas-con-mas-de-32-caracteres'

async function importToken() {
  // El módulo lee SESSION_SECRET en cada llamada, pero se reimporta limpio
  // para que ningún test arrastre estado del anterior.
  return import('@/lib/auth/token')
}

describe('token de sesión', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.SESSION_SECRET
  })

  it('descifra lo que ha cifrado', async () => {
    const { encrypt, decrypt } = await importToken()
    const token = await encrypt({ userId: '11111111-1111-4111-8111-111111111111' })

    await expect(decrypt(token)).resolves.toEqual({
      userId: '11111111-1111-4111-8111-111111111111',
    })
  })

  it('devuelve null si no hay token', async () => {
    const { decrypt } = await importToken()
    await expect(decrypt(undefined)).resolves.toBeNull()
    await expect(decrypt('')).resolves.toBeNull()
  })

  it('rechaza un token firmado con otra clave', async () => {
    const { decrypt } = await importToken()
    const ajeno = await new SignJWT({ userId: 'intruso' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('otra-clave-igualmente-larga-de-32+'))

    await expect(decrypt(ajeno)).resolves.toBeNull()
  })

  it('rechaza un token caducado', async () => {
    const { decrypt } = await importToken()
    const caducado = await new SignJWT({ userId: 'viejo' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(SECRET))

    await expect(decrypt(caducado)).resolves.toBeNull()
  })

  it('rechaza un token sin userId', async () => {
    const { decrypt } = await importToken()
    const sinUsuario = await new SignJWT({ algo: 'otra cosa' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET))

    await expect(decrypt(sinUsuario)).resolves.toBeNull()
  })

  it('exige que SESSION_SECRET sea lo bastante larga', async () => {
    const { encrypt } = await importToken()
    process.env.SESSION_SECRET = 'corta'

    await expect(encrypt({ userId: 'x' })).rejects.toThrow(/SESSION_SECRET/)
  })
})
