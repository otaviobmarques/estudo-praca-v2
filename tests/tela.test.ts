import { describe, it, expect } from "vitest";
import fs from "node:fs";
// Versão para celular (pedido do Otávio, 29/10/2026). A largura real é conferida no navegador (sem rolagem lateral em 390 px).
const html = fs.readFileSync("modelos/tela/painel.html", "utf8");
const css = fs.readFileSync("modelos/tela/tela.css", "utf8");
describe("Tela no celular", () => {
  it("barra fixa com Dados, Relatório e PDF", () => {
    expect(html).toContain('<aside class="painel" id="painel"');
    expect(html).toContain('<main class="relatorio" id="relatorio"');
    expect(html).toMatch(/<nav class="barra-celular"[^>]*><a href="#painel">Dados<\/a><a href="#relatorio">Relatório<\/a><button[^>]*id="b-pdf-cel"/);
  });
  it("regras para telas pequenas (uma coluna e campos de 16 px)", () => {
    expect(css).toContain("@media (max-width:900px)");
    expect(css).toMatch(/@media \(max-width:900px\)\{[^@]*\.app\{grid-template-columns:1fr/);
    expect(css).toMatch(/font-size:16px/);
  });
  it("administração e login também têm regras para celular", () => {
    expect(fs.readFileSync("components/admin.css", "utf8")).toContain("@media (max-width:700px)");
    expect(fs.readFileSync("app/login.css", "utf8")).toMatch(/@media \(max-width:760px\)[\s\S]*font-size:16px/);
  });
});
