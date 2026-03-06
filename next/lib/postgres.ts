import { Pool } from 'pg'

type GlobalWithPool = typeof globalThis & {
  __afridigestPgPool?: Pool
}

export function isPostgresEnabled(){
  return Boolean(process.env.DATABASE_URL)
}

function getPool(){
  const g = globalThis as GlobalWithPool
  if(g.__afridigestPgPool) return g.__afridigestPgPool

  const connectionString = process.env.DATABASE_URL
  if(!connectionString) throw new Error('DATABASE_URL is not set')

  g.__afridigestPgPool = new Pool({ connectionString })
  return g.__afridigestPgPool
}

export async function queryRows<T = any>(sql: string, params: any[] = []){
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result.rows as T[]
}
