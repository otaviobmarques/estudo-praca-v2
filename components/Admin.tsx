"use client";
import { useEffect, useState } from "react";
import AdminRede from "./AdminRede";
type U = { id: string; nome: string; usuario: string; email: string; papel: string; ativo: boolean };
export default function Admin() {
  const [itens, setItens] = useState<U[]>([]); const [msg, setMsg] = useState("");
  const carregar = () => fetch("/api/v1/usuarios").then((r) => r.json()).then((d) => setItens(d.itens ?? []));
  useEffect(() => { carregar(); }, []);
  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/v1/usuarios", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    setMsg(r.ok ? "Usuário criado." : (await r.json()).title); if (r.ok) { e.currentTarget.reset(); carregar(); }
  }
  async function alterar(id: string, corpo: object) {
    const r = await fetch(`/api/v1/usuarios/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
    setMsg(r.ok ? "Alteração salva." : (await r.json()).title); carregar();
  }
  return <main style={{ fontFamily: "Inter,Arial,sans-serif", padding: 32, maxWidth: 960 }}>
    <p><a href="/">← Voltar ao estudo</a></p><h1>Administração de usuários</h1><p role="status">{msg}</p>
    <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}><thead><tr><th align="left">Nome</th><th align="left">Usuário</th><th align="left">E-mail</th><th>Papel</th><th>Situação</th><th>Ações</th></tr></thead>
      <tbody>{itens.map((u) => <tr key={u.id} style={{ borderTop: "1px solid #ddd" }}><td>{u.nome}</td><td>{u.usuario}</td><td>{u.email}</td><td>{u.papel}</td><td>{u.ativo ? "Ativo" : "Desativado"}</td>
        <td><button onClick={() => alterar(u.id, { ativo: !u.ativo })}>{u.ativo ? "Desativar" : "Reativar"}</button>{" "}
          <button onClick={() => { const s = prompt("Nova senha (8+ caracteres, maiúscula, minúscula e número)"); if (s) alterar(u.id, { senha: s }); }}>Redefinir senha</button></td></tr>)}</tbody></table>
    <h2>Criar usuário</h2><form onSubmit={criar} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
      <label>Nome <input name="nome" required /></label><label>Usuário <input name="usuario" required pattern="[a-z0-9._\-]{3,40}" /></label>
      <label>E-mail <input name="email" type="email" required /></label><label>Senha inicial <input name="senha" type="password" required autoComplete="new-password" /></label>
      <button type="submit">Criar</button></form>
    <hr style={{ margin: "32px 0" }} /><AdminRede /></main>;
}
