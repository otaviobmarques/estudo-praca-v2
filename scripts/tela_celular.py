"""Versão da tela para celular e tablet (pedido do Otávio, 29/10/2026), aplicada depois de tela_ajustes.py:
- até 900 px: painel de dados em cima e relatório embaixo, numa coluna só;
- barra fixa no rodapé com "Dados", "Relatório" (âncoras) e "PDF" (aciona o mesmo botão do painel);
- cartões em 2 colunas, blocos em 1 coluna, tabelas com rolagem lateral dentro do bloco;
- campos com letra de 16 px (o iPhone não dá zoom ao tocar no campo).
Uso no painel.html já gerado: python3 scripts/tela_celular.py modelos/tela/painel.html"""
import sys


def ajustar(body: str) -> str:
    def R(a, b):
        nonlocal body
        assert a in body, a[:60]
        body = body.replace(a, b, 1)
    R('<aside class="painel" aria-label', '<aside class="painel" id="painel" aria-label')
    R('<main class="relatorio" aria-live', '<main class="relatorio" id="relatorio" aria-live')
    R('  </main>\n</div>', '  </main>\n  <nav class="barra-celular" aria-label="Navegação no celular"><a href="#painel">Dados</a><a href="#relatorio">Relatório</a>'
      '<button type="button" class="btn btn-principal" id="b-pdf-cel"><svg class="ic"><use href="#ic-baixar-pdf"/></svg>PDF</button></nav>\n</div>')
    return body


CSS = """
/* ---- celular e tablet (29/10/2026) ---- */
.barra-celular{display:none}
@media (max-width:900px){
.app{grid-template-columns:1fr;grid-template-rows:auto auto auto;padding-bottom:64px}
.topo{height:auto;min-height:52px;flex-wrap:wrap;gap:var(--esp-2) var(--esp-3);padding:var(--esp-2) var(--esp-4)}
.topo img{height:24px}.topo h1{font-size:14px;flex:1;min-width:0}.topo .base{display:none}.conta{gap:12px}
.painel{border-right:0;border-bottom:1px solid var(--cor-borda);padding:var(--esp-4)}
.relatorio{padding:var(--esp-4);gap:var(--esp-3)}
.cab{flex-direction:column;align-items:flex-start}.cab h2{font-size:24px}
.grade{grid-template-columns:1fr 1fr;gap:var(--esp-2)}.cartao{padding:var(--esp-3)}.cartao .val,.grade .cartao .val{font-size:19px}
.duas,.rede{grid-template-columns:1fr}.rede{gap:var(--esp-3)}
.bloco{overflow-x:auto}.oferta-num{grid-auto-flow:row;grid-template-columns:1fr 1fr}
.resultado{flex-wrap:wrap;gap:var(--esp-2)}
.marca-dagua{font-size:90px}
.entrada input,.entrada select,textarea,.meses-dre-tab input{font-size:16px}
.lista-busca li{padding:12px 10px}
.barra-celular{display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--esp-2);position:fixed;left:0;right:0;bottom:0;z-index:30;padding:var(--esp-2) var(--esp-3) calc(var(--esp-2) + env(safe-area-inset-bottom));background:var(--cor-escura);box-shadow:0 -4px 16px rgba(0,0,0,.18)}
.barra-celular a{display:flex;align-items:center;justify-content:center;height:40px;border-radius:var(--raio-botao);border:1.5px solid rgba(255,255,255,.35);color:var(--cor-sobre-escura);font:700 13px var(--fonte-texto);text-decoration:none}
.barra-celular .btn{height:40px}
#painel,#relatorio{scroll-margin-top:8px}
}
@media (max-width:420px){.linha.tres{grid-template-columns:1fr 1fr 1fr}.seletor-modelo button span{font-size:10.5px}}
"""

if __name__ == "__main__":
    arq = sys.argv[1]
    novo = ajustar(open(arq).read())  # lê antes de abrir para gravação
    open(arq, "w").write(novo)
    print("ok", arq)
