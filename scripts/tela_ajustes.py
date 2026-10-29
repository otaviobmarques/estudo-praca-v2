"""Ajustes da tela pedidos pelo Otávio (29/10/2026), aplicados depois de tela_dre_meses.py:
- remove o aviso legal provisório "[REVISAR – OTÁVIO]" (o aviso fixo aprovado continua na tela);
- selos "EXEMPLO" dos cartões e do DRE só aparecem no Exemplo Joinville (classe .so-exemplo);
- versão compacta (botões, campos, títulos e cartões menores) e uma família de fonte por papel
  (fontes servidas pelo próprio sistema em app/fontes.css);
- seta única no campo UF.
Uso no painel.html já gerado: python3 scripts/tela_ajustes.py modelos/tela/painel.html"""
import re
import sys


def ajustar(body: str) -> str:
    def R(a, b, n=1):
        nonlocal body
        assert a in body, a[:60]
        body = body.replace(a, b, n)
    body, k = re.subn(r'<b>Aviso legal \[REVISAR – OTÁVIO\]:</b> \*este estudo é uma estimativa[^<]*?execução comercial\. ', '', body)
    assert k == 1, "aviso provisório da tela não encontrado"
    R('Preenchido pela base e editável · <span id="selo-ex-base">valores de EXEMPLO</span>', 'Preenchido pela base e editável<span id="selo-ex-base"> · valores de EXEMPLO</span>')
    R('Estimativa IBGE 2025 · EXEMPLO</div>', 'Estimativa IBGE 2025<span class="so-exemplo"> · EXEMPLO</span></div>')
    R('Senatran, set/2026 · EXEMPLO</div>', 'Senatran, set/2026<span class="so-exemplo"> · EXEMPLO</span></div>')
    R('<span class="tag-ex">EXEMPLO</span>', '<span class="tag-ex so-exemplo">EXEMPLO</span>', 2)
    return body


CSS = """
/* ---- ajustes de 29/10/2026: EXEMPLO só no exemplo, seta única, versão compacta ---- */
.sem-exemplo .so-exemplo{display:none!important}
.entrada select{appearance:none;-webkit-appearance:none;background:none;cursor:default}
:root{--painel-largura:380px}
body{font-size:13px}
.app{grid-template-rows:60px auto}
.topo{height:60px;padding:var(--esp-2) var(--esp-5)}.topo img{height:30px}.topo h1{font-size:16px}
.painel{padding:var(--esp-4) var(--esp-5);gap:var(--esp-4)}
.grupo{gap:var(--esp-2)}.grupo>h2{font-size:12px}
.btn{height:38px;font-size:13px;padding:0 var(--esp-3)}
.acoes .btn{white-space:nowrap}
.entrada{height:38px}.entrada input,.entrada select,textarea{font-size:13px}
.campo label{font-size:12px}
.seletor-marca button{height:32px;font-size:13px}
.relatorio{padding:var(--esp-5);gap:var(--esp-4)}
.cab h2{font-size:30px}
.grade{gap:var(--esp-3)}
.cartao{padding:var(--esp-3) var(--esp-4)}.cartao .val,.grade .cartao .val{font-size:22px}
.seletor-modelo button{padding:7px 10px}.seletor-cenario button{padding:7px 4px}
.faixa-cenario{font-size:13px;padding:8px 12px}
.resultado b{font-size:22px}.rn b{font-size:22px}.rede{padding:var(--esp-4)}.rede-tit{font-size:19px}
.oferta-num b{font-size:18px}
#f-txt{height:118px}#r-txt .of-lista{margin:4px 0 0;padding-left:18px}
.bloco{padding:var(--esp-4)}.bloco h3{font-size:15px}
.cen th,.cen td{padding:7px 10px}
.marca-dagua{font-size:140px}
"""

if __name__ == "__main__":
    arq = sys.argv[1]
    novo = ajustar(open(arq).read())  # lê antes de abrir para gravação
    open(arq, "w").write(novo)
    print("ok", arq)
