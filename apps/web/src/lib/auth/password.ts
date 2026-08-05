import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'
import { promisify } from 'node:util'

// promisify elige la sobrecarga de tres argumentos, que no admite opciones.
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
) => Promise<Buffer>

// Parámetros de scrypt. N=16384 con r=8 usa unos 16 MB por hash (128*N*r), que
// entra de sobra en el maxmem por defecto de Node y cuesta lo bastante como
// para que un ataque por fuerza bruta no salga barato.
const N = 16_384
const r = 8
const p = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** Formato almacenado: scrypt$N$r$p$salt$hash, ambos en base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p })

  return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, rawN, rawR, rawP, rawSalt, rawHash] = parts
  const storedN = Number(rawN)
  const storedR = Number(rawR)
  const storedP = Number(rawP)
  if (!Number.isInteger(storedN) || !Number.isInteger(storedR) || !Number.isInteger(storedP)) {
    return false
  }

  const salt = Buffer.from(rawSalt, 'base64')
  const expected = Buffer.from(rawHash, 'base64')
  if (salt.length === 0 || expected.length === 0) return false

  const actual = await scrypt(password.normalize('NFKC'), salt, expected.length, {
    N: storedN,
    r: storedR,
    p: storedP,
  })

  // Ambos búferes miden lo mismo por construcción, pero timingSafeEqual lanza
  // si no coinciden en longitud y no conviene que eso escale como excepción.
  if (actual.length !== expected.length) return false

  return timingSafeEqual(actual, expected)
}
