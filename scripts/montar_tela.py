"""Copia a tela aprovada da Julia (design/tela/index.html) para modelos/tela/painel.html, com os ajustes de integração:
- busca de município (lista sob o campo Cidade); UF preenchida pela seleção;
- botões PNG/PDF com id; links Administração e Sair no topo;
- DRE disponível também no Home Based; custos do DRE um a um (12 despesas fixas da planilha);
- campos só de transferência (custo Detran, marketing) ocultos no Home Based;
- DRE em 10 meses (scripts/tela_dre_meses.py);
- ajustes de 29/10/2026: sem [REVISAR], EXEMPLO só no exemplo, versão compacta (scripts/tela_ajustes.py);
- celular e tablet (scripts/tela_celular.py)."""
import re, sys
T="/home/box/redbox/clientes/auto-visao/estudo-praca/design/tela/index.html"
h=open(T).read()
body=h[h.index("<body>")+6:h.index('<script src="app.js">')]
def R(a,b,n=1):
    global body; assert a in body,a[:60]; body=body.replace(a,b,n)
body=re.sub(r'src="\.\./assets/','src="/',body)
R('<div class="base"><svg class="ic"><use href="#ic-fonte-dados"/></svg>Base: Senatran set/2026 · IBGE Estimativa 2025 · Parâmetros v1.0</div>',
  '<div class="base"><svg class="ic"><use href="#ic-fonte-dados"/></svg>Base: Senatran set/2026 · IBGE Estimativa 2025 · Parâmetros v1.0</div><nav class="conta"><a id="l-admin" href="/admin" hidden>Administração</a><a id="l-sair" href="/entrar">Sair</a></nav>')
R('<button class="btn btn-escuro">','<button class="btn btn-escuro" id="b-png">')
R('<input id="f-cidade" value="Joinville" placeholder="Digite 2 letras para buscar"></div>',
  '<input id="f-cidade" value="" placeholder="Digite 2 letras para buscar" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="f-cidade-lista" aria-autocomplete="list"></div><ul id="f-cidade-lista" class="lista-busca" role="listbox" hidden></ul>')
R('<select id="f-uf"><option>SC</option></select>','<select id="f-uf" disabled><option></option></select>')
R('valores de EXEMPLO</span>','<span id="selo-ex-base">valores de EXEMPLO</span></span>')
R('<details class="grupo recolhivel so-full" id="g-dre" open>','<details class="grupo recolhivel" id="g-dre">')
R('<div class="campo"><label for="d-lu">Laudos/mês da unidade','<div class="campo so-full"><label for="d-lu">Laudos/mês da unidade')
R('<p class="ajuda">Volume próprio da unidade, dividido pela % Detran/cautelar. Não usa o potencial da cidade.</p></div>',
  '<p class="ajuda">Volume próprio da unidade, dividido pela % Detran/cautelar. Não usa o potencial da cidade.</p></div><p class="ajuda so-hb">No Home Based, o DRE usa os laudos/mês e o preço do laudo informados acima. As despesas que não se aplicam começam zeradas e podem ser editadas.</p><p class="alerta so-hb" id="d-alerta-hb" role="alert" hidden><svg class="ic"><use href="#ic-aviso"/></svg>Informe os laudos/mês do Home Based para incluir o DRE.</p>')
R('<div class="linha"><div class="campo"><label for="d-mkt">Marketing (R$ por vistoria Detran)</label><div class="entrada"><input id="d-mkt" value="8" inputmode="decimal"></div></div><div class="campo"><label for="d-cdet">Custo por vistoria Detran (R$)</label><div class="entrada"><input id="d-cdet" value="0" inputmode="decimal"></div></div></div>',
  '<div class="linha so-full"><div class="campo"><label for="d-mkt">Marketing (R$ por vistoria Detran)</label><div class="entrada"><input id="d-mkt" value="8" inputmode="decimal"></div></div><div class="campo"><label for="d-cdet">Custo por vistoria Detran (R$)</label><div class="entrada"><input id="d-cdet" value="0" inputmode="decimal"></div></div></div><div class="linha so-hb"><div class="campo"><label for="d-mkth">Marketing (R$/mês)</label><div class="entrada"><input id="d-mkth" value="0" inputmode="decimal"></div></div></div>')
R('<label for="d-ccau">Custo pesquisa por cautelar (R$)</label>','<label for="d-ccau">Custo da pesquisa por laudo cautelar (R$)</label>')
FIX=[("d-alu","Aluguel"),("d-agua","Água"),("d-ener","Energia"),("d-net","Internet / telefonia"),("d-cont","Contabilidade"),("d-manu","Manutenção predial"),("d-mat","Material de escritório"),("d-imps","Impressões"),("d-film","Sistema de filmagem"),("d-ouv","Canal de ouvidoria"),("d-iso","Certificação ISO + seguros"),("d-ger","Despesas gerais")]
campos="".join(f'<div class="campo"><label for="{i}">{r} (R$/mês)</label><div class="entrada"><input id="{i}" inputmode="decimal"></div></div>' for i,r in FIX)
ini=body.index('<div class="linha"><div class="campo"><label for="d-alu">'); fim=body.index('</details>',ini)
body=body[:ini]+f'<h3 class="sub-dre">Despesas fixas mensais</h3><div class="linha">{campos}</div><button type="button" class="btn btn-secundario" id="d-padrao">Voltar aos padrões do modelo</button>'+body[fim:]
R('<div class="marca-dagua">EXEMPLO</div>','<div class="marca-dagua" id="r-marca-dagua">EXEMPLO</div>')
R('<span class="selo-exemplo">','<span class="selo-exemplo" id="r-selo-ex">')
R('<section class="bloco" id="r-dre-bloco">','<section class="bloco" id="r-dre-bloco" hidden>')
import os; sys.path.insert(0,os.path.dirname(__file__)); from tela_dre_meses import ajustar, CSS as CSS_DRE_MESES
body=ajustar(body)  # DRE em 10 meses
from tela_ajustes import ajustar as ajustar_tela, CSS as CSS_AJUSTES
body=ajustar_tela(body)  # ajustes de 29/10/2026 (REVISAR, EXEMPLO, compacta)
from tela_celular import ajustar as ajustar_celular, CSS as CSS_CELULAR
body=ajustar_celular(body)  # celular e tablet
open("modelos/tela/painel.html","w").write(body)
css=open("modelos/tela/tela.css").read()
css+="""
/* ---- integração Domma ---- */
.conta{margin-left:auto;display:flex;gap:16px}.conta a{color:inherit;font-size:13px}
.campo{position:relative}.lista-busca{position:absolute;z-index:20;left:0;right:0;top:100%;margin:4px 0 0;padding:4px;list-style:none;background:var(--cor-superficie);border:1.5px solid var(--cor-borda);border-radius:10px;max-height:280px;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.lista-busca li{padding:8px 10px;border-radius:8px;cursor:pointer}.lista-busca li[aria-selected=true],.lista-busca li:hover{background:var(--cor-realce-suave)}
.sub-dre{font-size:13px;margin:12px 0 4px}#d-padrao{margin-top:8px}
"""
css+=CSS_DRE_MESES
css+=CSS_AJUSTES
css+=CSS_CELULAR
open("modelos/tela/tela.css","w").write(css)
print("ok",len(body))
