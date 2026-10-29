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
  return <section aria-labelledby="t-rede"><h2 id="t-rede">Sobre a rede</h2>
    <p style={{ color: "#575757" }}>Textos e números exibidos no relatório de cada marca. Guarde a comprovação dos números e da frase de destaque antes de publicar (regras do CONAR).</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 24 }}>
      {[...itens].sort((a, b) => a.marca.localeCompare(b.marca)).map((r) => <form key={r.marca} onSubmit={(e) => salvar(e, r.marca)} style={{ border: "1px solid #DADADA", borderRadius: 16, padding: 20, display: "grid", gap: 10 }} aria-label={`Sobre a rede — ${NOME[r.marca]}`}>
        <h3 style={{ margin: 0 }}>{NOME[r.marca]}</h3>
        {CAMPOS.map(([k, rot, max]) => <label key={k} style={{ display: "grid", gap: 4, fontSize: 13 }}>{rot}
          <input name={k} defaultValue={r[k] ?? ""} maxLength={max} required={k !== "destaque"} style={{ height: 40, border: "1.5px solid #DADADA", borderRadius: 10, padding: "0 10px", fontSize: 14 }} /></label>)}
        <button type="submit" style={{ height: 40, borderRadius: 99, border: 0, background: "#1A1A1A", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Salvar {NOME[r.marca]}</button>
        <p role="status" style={{ margin: 0, fontSize: 13 }}>{msg[r.marca] ?? ""}</p>
      </form>)}
    </div></section>;
}
