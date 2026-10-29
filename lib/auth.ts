import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { pool } from "./db";
import { avaliarSenha } from "./senha";

/** Parâmetros (escopo 6.3). Bloqueio de 10 min é decisão do Otávio; os demais são propostas [A CONFIRMAR]. */
export const ACESSO = { tentativas: 5, bloqueioMin: 10, sessaoHoras: 12, linkMin: 30 };
const ARGON = { algorithm: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }; // Argon2id (OWASP)
const COOKIE = "sessao";
const sha = (t: string) => createHash("sha256").update(t).digest("hex");
// Hash fictício para gastar o mesmo tempo quando o usuário não existe (evita enumeração por tempo).
let hashFicticio: Promise<string> | null = null;

export const gerarHash = (s: string) => hash(s, ARGON);

export type ResultadoLogin = { ok: true; usuarioId: string } | { ok: false; motivo: "invalido" | "bloqueado" };

export async function entrar(identificador: string, senha: string, ip: string): Promise<ResultadoLogin> {
  const id = identificador.trim().toLowerCase();
  const ipRow = await pool.query("select bloqueado_ate from tentativas_ip where ip=$1 and bloqueado_ate > now()", [ip]);
  if (ipRow.rowCount) return { ok: false, motivo: "bloqueado" };
  const { rows } = await pool.query("select id, senha_hash, ativo, bloqueado_ate > now() as bloqueado from usuarios where usuario=$1 or email=$1", [id]);
  const u = rows[0];
  if (u?.bloqueado) return { ok: false, motivo: "bloqueado" };
  hashFicticio ??= gerarHash(randomBytes(16).toString("hex"));
  const confere = await verify(u?.senha_hash ?? (await hashFicticio), senha).catch(() => false);
  if (u && u.ativo && confere) {
    await pool.query("update usuarios set falhas_login=0, bloqueado_ate=null where id=$1", [u.id]);
    await pool.query("delete from tentativas_ip where ip=$1", [ip]);
    return { ok: true, usuarioId: u.id };
  }
  const intervalo = `${ACESSO.bloqueioMin} minutes`;
  if (u) await pool.query(
    `update usuarios set falhas_login = case when bloqueado_ate is not null and bloqueado_ate <= now() then 1 else falhas_login+1 end,
       bloqueado_ate = case when (case when bloqueado_ate is not null and bloqueado_ate <= now() then 1 else falhas_login+1 end) >= $2 then now() + $3::interval else null end
     where id=$1`, [u.id, ACESSO.tentativas, intervalo]);
  // Por IP o limite é mais folgado (várias pessoas podem sair pelo mesmo IP do escritório).
  await pool.query(
    `insert into tentativas_ip(ip,falhas) values($1,1) on conflict (ip) do update set
       falhas = case when tentativas_ip.atualizado_em < now() - $3::interval then 1 else tentativas_ip.falhas+1 end,
       bloqueado_ate = case when tentativas_ip.falhas+1 >= $2 then now() + $3::interval else null end, atualizado_em=now()`,
    [ip, ACESSO.tentativas * 4, intervalo]);
  const b = u ? await pool.query("select bloqueado_ate > now() as b from usuarios where id=$1", [u.id]) : null;
  return { ok: false, motivo: b?.rows[0]?.b ? "bloqueado" : "invalido" };
}

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  await pool.query("insert into sessoes(id_hash,usuario_id,expira_em) values($1,$2,now() + $3::interval)", [sha(token), usuarioId, `${ACESSO.sessaoHoras} hours`]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.COOKIE_SECURE !== "false", sameSite: "lax", path: "/", maxAge: ACESSO.sessaoHoras * 3600 });
}

export type Usuario = { id: string; nome: string; usuario: string; papel: "usuario" | "administrador" };
export async function usuarioAtual(): Promise<Usuario | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const { rows } = await pool.query(
    "select u.id,u.nome,u.usuario,u.papel from sessoes s join usuarios u on u.id=s.usuario_id where s.id_hash=$1 and s.expira_em > now() and u.ativo", [sha(t)]);
  return rows[0] ?? null;
}
export async function sair() {
  const c = await cookies(); const t = c.get(COOKIE)?.value;
  if (t) await pool.query("delete from sessoes where id_hash=$1", [sha(t)]);
  c.delete(COOKIE);
}

/** Envio de e-mail: serviço [A DEFINIR na implantação]. Localmente só registra que haveria envio — nunca o link. */
async function enviarEmailRedefinicao(email: string, _link: string) {
  if (process.env.EMAIL_SERVICO) throw new Error("Serviço de e-mail ainda não implementado");
  console.info(JSON.stringify({ evento: "email_redefinicao_simulado", destinatario_dominio: email.split("@")[1] }));
}

export async function pedirRedefinicao(identificador: string) {
  const { rows } = await pool.query("select id,email from usuarios where (email=$1 or usuario=$1) and ativo", [identificador.trim().toLowerCase()]);
  if (!rows[0]) return; // resposta igual para quem não existe
  const token = randomBytes(32).toString("base64url");
  await pool.query("update tokens_redefinicao set usado_em=now() where usuario_id=$1 and usado_em is null", [rows[0].id]);
  await pool.query("insert into tokens_redefinicao(token_hash,usuario_id,expira_em) values($1,$2,now() + $3::interval)", [sha(token), rows[0].id, `${ACESSO.linkMin} minutes`]);
  await enviarEmailRedefinicao(rows[0].email, `${process.env.APP_URL}/redefinir-senha?t=${token}`);
}

export async function redefinirSenha(token: string, senha: string, confirmacao: string): Promise<"ok" | "senha_fraca" | "link_invalido"> {
  if (!avaliarSenha(senha, confirmacao).valida) return "senha_fraca";
  const c = await pool.connect();
  try {
    await c.query("begin");
    const { rows } = await c.query("update tokens_redefinicao set usado_em=now() where token_hash=$1 and usado_em is null and expira_em > now() returning usuario_id", [sha(token)]);
    if (!rows[0]) { await c.query("rollback"); return "link_invalido"; }
    await c.query("update usuarios set senha_hash=$2, falhas_login=0, bloqueado_ate=null where id=$1", [rows[0].usuario_id, await gerarHash(senha)]);
    await c.query("delete from sessoes where usuario_id=$1", [rows[0].usuario_id]);
    await c.query("commit"); return "ok";
  } catch (e) { await c.query("rollback"); throw e; } finally { c.release(); }
}
