"use client";
import { useState } from "react";
import MolduraLogin from "@/components/MolduraLogin";
export default function Esqueci() {
  const [msg, setMsg] = useState<string | null>(null);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    await fetch("/api/v1/senha/pedidos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.get("e") }) });
    setMsg("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.");
  }
  return <MolduraLogin>{msg ? <div><h2>Verifique seu e-mail</h2><p className="sub" role="status">{msg}</p><a className="btn" href="/entrar">Voltar ao login</a></div> :
    <form onSubmit={enviar} noValidate><h2>Esqueci a senha</h2><p className="sub">Informe o e-mail de cadastro. Enviaremos um link para criar uma nova senha.</p>
      <label htmlFor="e">E-mail</label><div className="campo"><input id="e" name="e" type="email" autoComplete="email" required /></div>
      <button className="btn" type="submit">Enviar link</button><p className="esqueci"><a href="/entrar">Voltar ao login</a></p></form>}</MolduraLogin>;
}
