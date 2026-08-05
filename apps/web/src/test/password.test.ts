// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('hashPassword / verifyPassword', () => {
  it('acepta la contraseña correcta', async () => {
    const hash = await hashPassword('correcto-caballo-grapa')
    await expect(verifyPassword('correcto-caballo-grapa', hash)).resolves.toBe(true)
  })

  it('rechaza una contraseña distinta', async () => {
    const hash = await hashPassword('correcto-caballo-grapa')
    await expect(verifyPassword('caballo-correcto-grapa', hash)).resolves.toBe(false)
  })

  it('usa una sal distinta en cada hash', async () => {
    const [a, b] = await Promise.all([hashPassword('misma'), hashPassword('misma')])
    expect(a).not.toBe(b)
  })

  it('guarda los parámetros junto al hash', async () => {
    const hash = await hashPassword('cualquiera')
    const [algorithm, N, r, p] = hash.split('$')
    expect(algorithm).toBe('scrypt')
    expect(Number(N)).toBe(16_384)
    expect(Number(r)).toBe(8)
    expect(Number(p)).toBe(1)
  })

  it('devuelve false ante un hash con formato inválido en vez de lanzar', async () => {
    await expect(verifyPassword('x', 'no-es-un-hash')).resolves.toBe(false)
    await expect(verifyPassword('x', 'bcrypt$1$2$3$4$5')).resolves.toBe(false)
    await expect(verifyPassword('x', 'scrypt$a$b$c$d$e')).resolves.toBe(false)
    await expect(verifyPassword('x', 'scrypt$16384$8$1$$')).resolves.toBe(false)
  })

  it('verifica hashes con parámetros distintos a los actuales', async () => {
    // Un hash creado con N=1024 tiene que seguir validando si algún día se
    // suben los parámetros por defecto.
    const legacy = 'scrypt$1024$8$1$c2FsdHNhbHRzYWx0c2Fs$' + (await (async () => {
      const { scrypt } = await import('node:crypto')
      const { promisify } = await import('node:util')
      const derive = promisify(scrypt) as (
        password: string,
        salt: Buffer,
        keylen: number,
        options: { N: number; r: number; p: number }
      ) => Promise<Buffer>
      const key = await derive('vieja', Buffer.from('c2FsdHNhbHRzYWx0c2Fs', 'base64'), 64, {
        N: 1024,
        r: 8,
        p: 1,
      })
      return key.toString('base64')
    })())

    await expect(verifyPassword('vieja', legacy)).resolves.toBe(true)
    await expect(verifyPassword('otra', legacy)).resolves.toBe(false)
  })
})
