import pg from "pg";
const g = globalThis as unknown as { _pool?: pg.Pool };
// Na Vercel cada função é uma instância curta: poucas conexões, pelo pooler do Supabase (porta 6543, modo transação).
const serverless = !!process.env.VERCEL;
export const pool = g._pool ?? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: serverless ? 1 : 5,
  idleTimeoutMillis: serverless ? 5000 : 30000,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : /supabase\.(co|com)/.test(process.env.DATABASE_URL ?? "") ? { rejectUnauthorized: false } : undefined,
});
g._pool = pool;
