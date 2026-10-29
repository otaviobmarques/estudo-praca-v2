"use client";
import { useEffect, useState } from "react";
import AdminRede from "./AdminRede";
import "./admin.css";
type U = { id: string; nome: string; usuario: string; email: string; papel: string; ativo: boolean };
type Msg = { texto: string; erro: boolean } | null;
/** Administração de usuários e "Sobre a rede", com o design system da tela (tokens.css + tela.css). */
export default function Admin() {
  const [itens, setItens] = useState<U[]>([]); const [msg, setMsg] = useState<Msg>(null); const [senhaDe, setSenhaDe] = useState<string | null>(null);
  const carregar = () => fetch("/api/v1/usuarios").then((r) => r.json()).then((d) => setItens(d.itens ?? []));
  useEffect(() => { carregar(); }, []);
  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const f = Object.fromEntries(new FormData(form));
    const r = await fetch("/api/v1/usuarios", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    setMsg(r.ok ? { texto: "Usuário criado.", erro: false } : { texto: (await r.json()).title, erro: true }); if (r.ok) { form.reset(); carregar(); }
  }
  async function alterar(id: string, corpo: object) {
    const r = await fetch(`/api/v1/usuarios/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
    setMsg(r.ok ? { texto: "Alteração salva.", erro: false } : { texto: (await r.json()).title, erro: true }); if (r.ok) setSenhaDe(null); carregar();
  }
  async function sair(e: React.MouseEvent) { e.preventDefault(); await fetch("/api/v1/sessoes", { method: "DELETE" }); location.href = "/entrar"; }
  return <div className="adm">
    <header className="topo">
      <img src="/auto-visao_logo-oficial_branco-integral.svg" alt="Auto Visão" />
      <h1>Gerador de Estudo de Praça</h1>
      <div className="base">Administração</div>
      <nav className="conta"><a href="/">Voltar ao estudo</a><a href="/entrar" onClick={sair}>Sair</a></nav>
    </header>
    <main className="adm-corpo">
      <div className="adm-cab"><div><h2>Administração</h2><p>Usuários com acesso ao gerador e textos da seção &quot;Sobre a rede&quot;.</p></div></div>
      {msg && <p role="status" className={`adm-msg${msg.erro ? " erro" : ""}`}>{msg.texto}</p>}
      <section className="bloco" aria-labelledby="t-usuarios">
        <h3 id="t-usuarios">Usuários</h3>
        <table className="cen"><thead><tr><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Papel</th><th>Situação</th><th className="adm-acoes">Ações</th></tr></thead>
          <tbody>{itens.map((u) => [
            <tr key={u.id}><td>{u.nome}</td><td>{u.usuario}</td><td>{u.email}</td>
              <td><span className={`selo-papel${u.papel === "administrador" ? " admin" : ""}`}>{u.papel === "administrador" ? "Administrador" : "Usuário"}</span></td>
              <td><span className={`selo-sit ${u.ativo ? "ativo" : "inativo"}`}>{u.ativo ? "Ativo" : "Desativado"}</span></td>
              <td className="adm-acoes"><button className="btn btn-secundario" onClick={() => alterar(u.id, { ativo: !u.ativo })}>{u.ativo ? "Desativar" : "Reativar"}</button>
                <button className="btn btn-secundario" onClick={() => setSenhaDe(senhaDe === u.id ? null : u.id)}>Redefinir senha</button></td></tr>,
            senhaDe === u.id && <tr key={u.id + "-s"} className="adm-senha"><td colSpan={6}>
              <form className="linha-senha" onSubmit={(e) => { e.preventDefault(); alterar(u.id, { senha: String(new FormData(e.currentTarget).get("senha")) }); }}>
                <span>Nova senha de <b>{u.usuario}</b> (8+ caracteres, maiúscula, minúscula e número)</span>
                <div className="entrada"><input name="senha" type="password" required autoComplete="new-password" aria-label={`Nova senha de ${u.usuario}`} autoFocus /></div>
                <button className="btn btn-principal" type="submit">Salvar</button><button className="btn btn-secundario" type="button" onClick={() => setSenhaDe(null)}>Cancelar</button>
              </form></td></tr>,
          ])}</tbody></table>
      </section>
      <section className="bloco" aria-labelledby="t-criar">
        <h3 id="t-criar">Criar usuário</h3>
        <p className="ajuda">O novo usuário entra com a senha inicial e pode trocá-la em &quot;Esqueci a senha&quot;.</p>
        <form onSubmit={criar} className="adm-form">
          <div className="campo"><label htmlFor="n-nome">Nome</label><div className="entrada"><input id="n-nome" name="nome" required /></div></div>
          <div className="campo"><label htmlFor="n-usuario">Usuário</label><div className="entrada"><input id="n-usuario" name="usuario" required pattern="[a-z0-9._\-]{3,40}" title="3 a 40 letras minúsculas, números, ponto, hífen ou sublinhado" /></div></div>
          <div className="campo"><label htmlFor="n-email">E-mail</label><div className="entrada"><input id="n-email" name="email" type="email" required /></div></div>
          <div className="campo"><label htmlFor="n-senha">Senha inicial</label><div className="entrada"><input id="n-senha" name="senha" type="password" required autoComplete="new-password" /></div></div>
          <button className="btn btn-principal" type="submit">Criar usuário</button>
        </form>
      </section>
      <AdminRede />
    </main>
  </div>;
}
