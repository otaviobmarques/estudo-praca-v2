import base from "../dados/municipios.json";
type M = { cod_ibge: string; nome: string; uf: string; nome_normalizado: string; populacao: number; frota_total: number };
const lista = (base as { municipios: M[] }).municipios;
export const metaBase = (base as { meta: unknown }).meta;
const norm = (t: string) => t.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export function buscarMunicipios(q: string, limite = 10) {
  const n = norm(q); if (n.length < 2) return [];
  return lista.filter((m) => m.nome_normalizado.startsWith(n)).concat(lista.filter((m) => !m.nome_normalizado.startsWith(n) && m.nome_normalizado.includes(n)))
    .slice(0, limite).map(({ cod_ibge, nome, uf, populacao, frota_total }) => ({ cod_ibge, nome, uf, populacao, frota: frota_total }));
}
