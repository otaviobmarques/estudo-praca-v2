import pg from "pg";
const g = globalThis as unknown as { _pool?: pg.Pool };
export const pool = g._pool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 30000 });
g._pool = pool;
