"use client";
import { useEffect, useState } from "react";
type Rede = { marca: string; destaque: string | null; lojas: string; estados: string; laudos_mes: string; frase_full: string; frase_home_based: string };
const NOME: Record<string, string> = { "auto-visao": "Auto Visão", royal: "Royal Vistorias" };
const CAMPOS: [keyof Rede, string, number][] = [["destaque", "Destaque (opcional)", 80], ["lojas", "Lojas", 12], ["estados", "Estados", 12], ["laudos_mes", "Laudos por mês", 16],
  ["frase_full", "Frase — Franquia Full", 140], ["frase_home_based", "Frase — Franquia Home Based", 140]];
/** Edição da seção "Sobre a rede" por marca (escopo M11). Cada marca é salva separadamente. */
export default function AdminRede() {
  const [itens, setItens] = useState<Rede[]>([]); const [msg, setMsg] = useState<Record<string, string>>({});
  useEffect(() => { fetch("/api/v1/rede").then((r) => r.json()).then((d) => setItens(d.itens ?? [])); }, []);
  async function salvar(e: React.FormEvent<HTMLFormElement>, marca: string) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`/api/v1/rede/${marca}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    setMsg({ ...msg, [marca]: r.ok ? "Salvo. Vale para os próximos PDFs." : `Não salvo: ${(await r.json()).detail ?? "dados inválidos"}` });
  }
  return <section className="bloco" aria-labelledby="t-rede"><h3 id="t-rede">Sobre a rede</h3>
    <p className="ajuda">Textos e números exibidos no relatório de cada marca. Guarde a comprovação dos números e da frase de destaque antes de publicar (regras do CONAR).</p>
    <div className="adm-redes">
      {[...itens].sort((a, b) => a.marca.localeCompare(b.marca)).map((r) => <form key={r.marca} onSubmit={(e) => salvar(e, r.marca)} aria-label={`Sobre a rede — ${NOME[r.marca]}`}>
        <h4>{NOME[r.marca]}</h4>
        {CAMPOS.map(([k, rot, max]) => <div className="campo" key={k}><label htmlFor={`${r.marca}-${k}`}>{rot}</label>
          <div className="entrada"><input id={`${r.marca}-${k}`} name={k} defaultValue={r[k] ?? ""} maxLength={max} required={k !== "destaque"} /></div></div>)}
        <button type="submit" className="btn btn-escuro">Salvar {NOME[r.marca]}</button>
        <p role="status" className="msg">{msg[r.marca] ?? ""}</p>
      </form>)}
    </div></section>;
}
