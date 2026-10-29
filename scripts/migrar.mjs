import pg from "pg"; import fs from "node:fs";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
await c.query("create table if not exists migracoes_aplicadas (nome text primary key, aplicada_em timestamptz not null default now())");
for (const f of fs.readdirSync("db/migracoes").sort()) {
  const { rowCount } = await c.query("select 1 from migracoes_aplicadas where nome=$1", [f]);
  if (rowCount) continue;
  await c.query("begin"); await c.query(fs.readFileSync(`db/migracoes/${f}`, "utf8").replace(/create table migracoes_aplicadas[^;]*;/, ""));
  await c.query("insert into migracoes_aplicadas(nome) values($1)", [f]); await c.query("commit"); console.log("aplicada:", f);
}
await c.end();
