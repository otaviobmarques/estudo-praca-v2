"use client";
import { useState } from "react";
import MolduraLogin from "@/components/MolduraLogin";
export default function Entrar() {
  const [erro, setErro] = useState<string | null>(null); const [bloq, setBloq] = useState(false); const [ver, setVer] = useState(false); const [env, setEnv] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setEnv(true); const f = new FormData(e.currentTarget);
    const r = await fetch("/api/v1/sessoes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identificador: f.get("u"), senha: f.get("s") }) });
    setEnv(false);
    if (r.ok) { location.href = "/"; return; }
    const p = await r.json().catch(() => ({})); setBloq(r.status === 429); setErro(r.status === 429 ? p.detail : "Usuário ou senha inválidos.");
  }
  return <MolduraLogin><form onSubmit={enviar} aria-labelledby="t" noValidate>
    <h2 id="t">Entrar</h2><p className="sub">Use o usuário e a senha fornecidos pelo administrador.</p>
    {erro && <div className="alerta" role="alert">{erro}</div>}
    <label htmlFor="u">Usuário ou e-mail</label><div className="campo"><input id="u" name="u" autoComplete="username" required disabled={bloq} aria-invalid={!!erro && !bloq} /></div>
    <label htmlFor="s">Senha</label><div className="campo"><input id="s" name="s" type={ver ? "text" : "password"} autoComplete="current-password" required disabled={bloq} aria-invalid={!!erro && !bloq} />
      <button type="button" className="olho" aria-pressed={ver} aria-controls="s" onClick={() => setVer(!ver)}>{ver ? "Ocultar" : "Mostrar"}</button></div>
    <p className="esqueci"><a href="/esqueci-senha">Esqueci a senha</a></p>
    <button className="btn" type="submit" disabled={bloq || env}>Entrar</button>
    <p className="nota">Acesso fornecido pelo administrador.</p></form></MolduraLogin>;
}
