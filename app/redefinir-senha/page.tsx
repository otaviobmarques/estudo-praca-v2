"use client";
import { useState } from "react";
import MolduraLogin from "@/components/MolduraLogin";
import { avaliarSenha } from "@/lib/senha";
export default function NovaSenha() {
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [ok, setOk] = useState(false); const [erro, setErro] = useState<string | null>(null);
  const av = avaliarSenha(a, b);
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); const token = new URLSearchParams(location.search).get("t") ?? "";
    const r = await fetch("/api/v1/senha/redefinicoes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, senha: a, confirmacao: b }) });
    if (r.ok) setOk(true); else setErro(r.status === 410 ? "Link inválido ou expirado. Peça um novo link em \"Esqueci a senha\"." : "A senha não atende às regras.");
  }
  if (ok) return <MolduraLogin><div role="status"><h2>Senha alterada</h2><p className="sub">Sua nova senha foi salva. Entre com ela para continuar.</p><a className="btn" href="/entrar">Voltar ao login</a></div></MolduraLogin>;
  return <MolduraLogin><form onSubmit={enviar} noValidate><h2>Criar nova senha</h2><p className="sub">Escolha uma senha nova para entrar no Gerador.</p>
    {erro && <div className="alerta" role="alert">{erro}</div>}
    <label htmlFor="n1">Nova senha</label><div className="campo"><input id="n1" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} aria-describedby="regras" /></div>
    <label htmlFor="n2">Confirmar senha</label><div className="campo"><input id="n2" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} aria-describedby="regras" /></div>
    <ul className="regras" id="regras" aria-live="polite">{av.regras.map((r) => <li key={r.id} className={r.ok ? "ok" : "pend"}><span>{r.ok ? "✓ " : "○ "}{r.rotulo}</span><span className="sr">{r.ok ? " (atendida)" : " (pendente)"}</span></li>)}</ul>
    <button className="btn" type="submit" disabled={!av.valida}>Salvar nova senha</button></form></MolduraLogin>;
}
