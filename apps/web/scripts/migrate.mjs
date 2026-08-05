#!/usr/bin/env node
/**
 * Aplica las migraciones SQL de db/migrations en orden alfabético.
 *
 * Se ejecuta antes de arrancar el servidor en Railway, así que tiene que ser
 * idempotente: lleva la cuenta de lo ya aplicado en la tabla schema_migrations
 * y toma un advisory lock para que dos instancias arrancando a la vez no
 * intenten migrar en paralelo.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const LOCK_ID = 8_147_326_591 // arbitrario, solo tiene que ser estable

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = process.env.MIGRATIONS_DIR
  ? resolve(process.env.MIGRATIONS_DIR)
  : resolve(here, '../../../db/migrations')

async function main() {
  // Migrar exige crear tablas, y el rol con el que corre la aplicación puede
  // no tener permiso para hacerlo (ver db/create-app-role.sql). Por eso se
  // admite una conexión distinta y con más privilegios solo para esto.
  const connectionString = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta MIGRATION_DATABASE_URL o DATABASE_URL')
  }

  const client = new pg.Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    await client.query('select pg_advisory_lock($1)', [LOCK_ID])

    const { rows } = await client.query('select name from public.schema_migrations')
    const applied = new Set(rows.map((r) => r.name))

    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()

    const pending = files.filter((f) => !applied.has(f))
    if (pending.length === 0) {
      console.log(`[migrate] sin migraciones pendientes (${applied.size} aplicadas)`)
      return
    }

    for (const file of pending) {
      const sql = await readFile(join(migrationsDir, file), 'utf8')
      console.log(`[migrate] aplicando ${file}`)
      try {
        await client.query('begin')
        await client.query(sql)
        await client.query('insert into public.schema_migrations (name) values ($1)', [file])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw new Error(`Falló la migración ${file}: ${error.message}`, { cause: error })
      }
    }

    console.log(`[migrate] ${pending.length} migración(es) aplicadas`)
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {})
    await client.end()
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`)
  process.exit(1)
})
