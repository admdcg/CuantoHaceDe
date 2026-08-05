import pg from 'pg'

const { Pool, types } = pg

// Supabase devolvía las marcas de tiempo como cadenas ISO y los tipos de
// @cuantohacede/types las declaran como string. node-postgres las convierte a
// Date por defecto, así que se registra el parser para conservar el contrato.
types.setTypeParser(1184, (value) => new Date(value).toISOString()) // timestamptz
types.setTypeParser(1114, (value) => new Date(`${value}Z`).toISOString()) // timestamp

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL')
  }

  return new Pool({
    connectionString,
    // En Railway la app habla con Postgres por la red privada, donde TLS no
    // aporta nada y el certificado no valida. Se activa con DATABASE_SSL=true
    // para conexiones que salgan a internet.
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  })
}

// El hot reload de desarrollo reevalúa los módulos y dejaría pools huérfanos.
const globalForDb = globalThis as unknown as { __pool?: pg.Pool }

export function getPool(): pg.Pool {
  if (!globalForDb.__pool) {
    globalForDb.__pool = createPool()
  }
  return globalForDb.__pool
}

/**
 * Consulta sin usuario en contexto. Solo para lo que vive fuera de RLS:
 * registro y login, que ocurren antes de que exista sesión.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params)
}

/**
 * Ejecuta fn dentro de una transacción con app.user_id fijado, que es lo que
 * leen las políticas de RLS.
 *
 * El tercer argumento de set_config es is_local=true: el valor se descarta al
 * terminar la transacción, de modo que la conexión vuelve limpia al pool y no
 * arrastra el usuario de la petición anterior.
 */
export async function withUser<T>(
  userId: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('begin')
    await client.query('select set_config($1, $2, true)', ['app.user_id', userId])
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
