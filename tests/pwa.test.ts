import { describe, it, expect } from "vitest";
import fs from "node:fs";
import manifesto from "../lib/manifesto";
// PWA (pedido do Otávio, 29/10/2026): instalável, ícone neutro (atende as duas marcas) e sem guardar dado de estudo.
const png = (p: string) => { const b = fs.readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
describe("PWA", () => {
  it("manifesto instalável", () => {
    const m = manifesto();
    expect(m).toMatchObject({ name: "Gerador de Estudo de Praça", short_name: "Estudo de Praça", start_url: "/", display: "standalone", lang: "pt-BR" });
    const tam = (m.icons ?? []).map((i) => `${i.sizes} ${i.purpose ?? "any"}`);
    expect(tam).toEqual(expect.arrayContaining(["192x192 any", "512x512 any", "512x512 maskable"]));
  });
  it("ícones existem no tamanho declarado", () => {
    for (const i of manifesto().icons ?? []) expect(png(`public${i.src}`).join("x")).toBe(i.sizes);
    expect(png("public/icones/apple-touch-icon.png")).toEqual([180, 180]);
  });
  it("service worker não guarda API nem páginas com login; tem página offline", () => {
    const sw = fs.readFileSync("public/sw.js", "utf8");
    expect(sw).toMatch(/\/api\//); // a API é explicitamente ignorada
    expect(sw).toMatch(/mode === "navigate"/); // páginas: sempre da rede; sem rede, offline.html
    expect(sw).not.toMatch(/cache\.put\(req(uest)?, *res[^)]*\).*navigate/);
    expect(fs.existsSync("public/offline.html")).toBe(true);
  });
});
