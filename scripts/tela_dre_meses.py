"""DRE em 10 meses na tela (decisão de 29/10/2026): troca o campo "Laudos/mês da unidade" por uma tabela
com os volumes de cada mês e prepara a prévia do DRE para 10 colunas + total.
Usado por montar_tela.py (sobre a tela da Julia já ajustada) e aplicável ao painel.html já gerado:
    python3 scripts/tela_dre_meses.py modelos/tela/painel.html"""
import sys

MESES = 10
ANTES_CAMPO = '<div class="campo so-full"><label for="d-lu">Laudos/mês da unidade'
FIM_CAMPO = '<p class="ajuda">Volume próprio da unidade, dividido pela % Detran/cautelar. Não usa o potencial da cidade.</p></div>'


def tabela():
    linhas = "".join(
        f'<tr><th scope="row">{i}</th>'
        f'<td class="so-full"><input id="d-m{i}-t" inputmode="numeric" aria-label="Mês {i} · laudos Detran"></td>'
        f'<td><input id="d-m{i}-c" inputmode="numeric" aria-label="Mês {i} · laudos cautelares"></td></tr>'
        for i in range(1, MESES + 1))
    return (
        '<div class="campo meses-dre"><span class="rotulo-meses">Laudos de cada mês <span class="req" id="d-req" hidden>obrigatório</span></span>'
        '<table class="meses-dre-tab"><thead><tr><th>Mês</th><th class="so-full">Detran</th><th>Cautelar</th></tr></thead>'
        f'<tbody>{linhas}</tbody></table>'
        '<p class="alerta" id="d-alerta" role="alert" hidden><svg class="ic"><use href="#ic-aviso"/></svg>Preencha os laudos dos 10 meses ou desligue o DRE. Sem esses números, o PDF não sai com o DRE.</p>'
        '<p class="ajuda so-full">Padrão: colunas da planilha de referência (mês 1 = 100 Detran + 10 cautelar … mês 10 = 550 + 100), editáveis por cidade. Não usa o potencial da cidade.</p>'
        '<p class="ajuda so-hb">Mês em branco = laudos/mês informados acima.</p></div>')


def ajustar(body: str) -> str:
    def R(a, b):
        nonlocal body
        assert a in body, a[:60]
        body = body.replace(a, b, 1)
    ini = body.index(ANTES_CAMPO)
    fim = body.index(FIM_CAMPO, ini) + len(FIM_CAMPO)
    body = body[:ini] + tabela() + body[fim:]
    R('DRE mensal <span class="tag-ex">EXEMPLO</span></h2>', 'DRE em 10 meses <span class="tag-ex">EXEMPLO</span></h2>')
    R('Volume = laudos/mês da unidade; tickets e divisão vêm do painel.', 'Volume = laudos de cada mês (tabela abaixo); tickets e divisão vêm do painel.')
    R('DRE mensal simulado <span class="tag-ex">EXEMPLO</span></h3>', 'DRE simulado em 10 meses <span class="tag-ex">EXEMPLO</span></h3>')
    R('<table class="cen dre" id="r-dre"></table>', '<div class="dre-rolagem"><table class="cen dre dre-meses" id="r-dre"></table></div>')
    return body


CSS = """
/* ---- DRE em 10 meses ---- */
.meses-dre-tab{width:100%;border-collapse:collapse;margin:4px 0}.meses-dre-tab th{font-size:12px;font-weight:600;text-align:left;padding:2px 4px}
.meses-dre-tab td{padding:2px 4px}.meses-dre-tab input{width:100%;box-sizing:border-box;padding:6px 8px;border:1.5px solid var(--cor-borda);border-radius:8px;font:inherit;text-align:right}
.rotulo-meses{font-size:13px;font-weight:600}
.dre-rolagem{overflow-x:auto}.dre-meses{font-size:11px;white-space:nowrap}.dre-meses td,.dre-meses th{padding:5px 4px}.dre-meses tr td:first-child{padding-left:0}.dre-meses td+td,.dre-meses th+th{text-align:right}.dre-meses td:last-child,.dre-meses th:last-child{font-weight:700}
"""

if __name__ == "__main__":
    arq = sys.argv[1]
    novo = ajustar(open(arq).read())  # lê antes de abrir para gravação
    open(arq, "w").write(novo)
    print("ok", arq)
