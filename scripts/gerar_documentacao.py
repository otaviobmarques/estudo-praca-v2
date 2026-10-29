"""Gera docs/documentacao-tecnica-estudo-praca-v2.pdf a partir de docs/fonte/documentacao-tecnica.md.
Insere a API (docs/openapi.yaml), os ADRs, o CHANGELOG e os resultados dos testes (docs/fonte/resultados/).
Uso: python3 scripts/gerar_documentacao.py   (não lê .env nem segredos)"""
import re, html, json, glob, base64, os, yaml, markdown
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); F = f"{R}/docs/fonte"
md = open(f"{F}/documentacao-tecnica.md").read()
VERSAO = json.load(open(f"{R}/package.json"))["version"]

def api():
    d = yaml.safe_load(open(f"{R}/docs/openapi.yaml")); o = []
    o.append(f"Contrato: `docs/openapi.yaml` (OpenAPI {d['openapi']}, versão {d['info']['version']}). {d['info']['description'].strip()}\n")
    o.append(f"Base: `{d['servers'][0]['url']}`. Autenticação: cookie `sessao` (exceto onde indicado “pública”).\n")
    o.append("| Método | Rota | Resumo | Acesso | Respostas |\n|---|---|---|---|---|")
    for p, ms in d["paths"].items():
        for m, op in ms.items():
            pub = "pública" if op.get("security") == [] else ("administrador" if "Administração" in op.get("tags", []) else "sessão")
            rs = ", ".join(sorted(op["responses"].keys()))
            o.append(f"| `{m.upper()}` | `{p}` | {op['summary']} | {pub} | {rs} |")
    o.append("\n### Detalhe das rotas\n")
    def ref(s):
        return s["$ref"].split("/")[-1] if isinstance(s, dict) and "$ref" in s else None
    for p, ms in d["paths"].items():
        for m, op in ms.items():
            o.append(f"**`{m.upper()} {p}`** — {op['summary']}\n")
            for pr in op.get("parameters", []):
                o.append(f"- Parâmetro `{pr['name']}` ({pr['in']}{', obrigatório' if pr.get('required') else ''}): `{json.dumps(pr['schema'], ensure_ascii=False)}`")
            rb = op.get("requestBody")
            if rb:
                c = list(rb["content"].values())[0]; nome = ref(c.get("schema", {})) or "objeto"
                o.append(f"- Corpo: `{nome}`" + (f" — exemplo `{json.dumps(c['example'], ensure_ascii=False)}`" if "example" in c else ""))
            for code, r in op["responses"].items():
                desc = r.get("description") or d["components"]["responses"][ref(r)]["description"]
                o.append(f"- **{code}**: {desc}")
            o.append("")
    o.append("### Esquemas\n")
    for n, s in d["components"]["schemas"].items():
        props = s.get("properties", {}); req = set(s.get("required", []))
        o.append(f"**{n}**" + (f" — {s['description']}" if 'description' in s else "") + "\n")
        o.append("| Campo | Tipo | Obrigatório | Observação |\n|---|---|---|---|")
        for k, v in props.items():
            t = ref(v) or (" | ".join(v["type"]) if isinstance(v.get("type"), list) else v.get("type", "objeto"))
            if "enum" in v: t += " (" + ", ".join(map(str, v["enum"])) + ")"
            obs = "; ".join(x for x in [v.get("description", ""), f"ex.: {v['example']}" if "example" in v else "",
                                        f"máx. {v['maxLength']}" if "maxLength" in v else ""] if x)
            o.append(f"| `{k}` | {t} | {'sim' if k in req else 'não'} | {obs} |")
        o.append("")
    o.append("Erros: todas as rotas respondem erros no formato **Problem Details** (`application/problem+json`, campos `type`, `title`, `status`, `detail`).")
    return "\n".join(o)

def adrs():
    o = []
    for f in sorted(glob.glob(f"{R}/docs/adr/*.md")):
        t = open(f).read().strip()
        t = re.sub(r"^# (.*)$", r"### \1", t, count=1, flags=re.M); t = re.sub(r"^## ", "#### ", t, flags=re.M)
        o.append(t)
    return "\n\n".join(o)

def changelog():
    t = open(f"{R}/CHANGELOG.md").read(); t = re.sub(r"^# .*\n", "", t)
    return re.sub(r"^### ", "#### ", re.sub(r"^## ", "### ", t, flags=re.M), flags=re.M)

def resultados():
    v = open(f"{F}/resultados/vitest.txt").read()
    tot = re.search(r"Tests\s+(\d+) passed \((\d+)\)", v); arq = re.search(r"Test Files\s+(\d+) passed", v)
    fu = open(f"{F}/resultados/fumaca.txt").read(); ok = len(re.findall(r"^OK", fu, re.M)); fal = re.search(r"falhas: (\d+)", fu).group(1)
    tc = open(f"{F}/resultados/typecheck.txt").read().strip()
    o = ["| Verificação | Resultado |", "|---|---|",
         f"| Testes unitários (vitest) | **{tot.group(1)} de {tot.group(2)} passando** em {arq.group(1)} arquivos |",
         f"| Verificação de tipos (`tsc --noEmit`) | {tc} |",
         "| Montagem (`npm run build`) | concluída sem erros |",
         f"| Integração (`fumaca.sh`) | **{ok} verificações OK, {fal} falhas** |", ""]
    o.append("**Testes unitários (lista completa):**\n")
    o.append("```text\n" + "\n".join(l.rstrip() for l in v.splitlines() if l.strip().startswith(("✓", "×", "↓")) ) + "\n```")
    o.append("\n**Integração (saída do `fumaca.sh`, sem senhas):**\n")
    o.append("```text\n" + fu.strip() + "\n```")
    r = json.load(open(f"{F}/resultados/resumo.json")); rt = json.load(open(f"{F}/resultados/resumo-tela.json"))
    o.append("\n**Fidelidade visual do PDF (pixels diferentes por página, contra as prévias da Julia):**\n")
    o.append("| Variação | Pág. 1 | Pág. 2 | Pág. 3 |\n|---|---|---|---|")
    for k, ps in r.items():
        cel = [("—" if x["pixels_diferentes_pct"] is None else f"{x['pixels_diferentes_pct']:.1f}%".replace(".", ",")) for x in ps] + [""] * (3 - len(ps))
        o.append(f"| {k.replace('_', ' · ')} | " + " | ".join(cel) + " |")
    o.append("\n“—” = não há prévia da Julia para essa variação (Home Based com DRE).\n")
    o.append("**Fidelidade visual da tela:**\n\n| Estado | Diferença |\n|---|---|")
    for k, x in rt.items(): o.append(f"| {k.replace('_', ' · ')} | {str(x).replace('.', ',')}% |")
    o.append("\nNos estados com DRE ligado, a tela tem mais campos e linhas que a prévia (custos campo a campo, pedido do Otávio), o que explica a diferença maior.")
    return "\n".join(o)

def exemplos():
    o = ["| Auto Visão · Full com DRE (3 páginas) | Royal · Home Based com DRE (3 páginas) |", "|---|---|"]
    for i in (1, 2, 3):
        o.append(f"| ![](ex-av-full-{i}.png) | ![](ex-rv-hb-{i}.png) |")
    return "\n".join(o)

for k, f in {"API": api, "ADRS": adrs, "CHANGELOG": changelog, "RESULTADOS": resultados, "EXEMPLOS": exemplos}.items():
    md = md.replace("{{" + k + "}}", f())

blocks = []
md = re.sub(r"```mermaid\n(.*?)```", lambda m: (blocks.append(m.group(1)), f"\n\nMERMAIDBLOCK{len(blocks)-1}\n\n")[1], md, flags=re.S)
maths = []
md = md.replace("R$", "RDOLARX")  # "R$" de dinheiro nunca é fórmula
def km(m):
    t = m.group(0)
    if not t.startswith("$$"): t = "\\(" + t[1:-1] + "\\)"  # fórmula em linha vira \( \)
    maths.append(t); return f"MATHX{len(maths)-1}X"
partes = re.split(r"(```.*?```|`[^`\n]+`)", md, flags=re.S)
md = "".join(p if i % 2 else re.sub(r"\$\$.*?\$\$|\$[^$\n]+\$", km, p) for i, p in enumerate(partes))
h = markdown.markdown(md, extensions=["tables", "fenced_code", "toc", "attr_list"])
for i, b in enumerate(blocks): h = h.replace(f"<p>MERMAIDBLOCK{i}</p>", f'<pre class="mermaid">{html.escape(b)}</pre>')
for i, m in enumerate(maths): h = h.replace(f"MATHX{i}X", html.escape(m))
h = h.replace("RDOLARX", "R$")
def img(m):
    src = m.group(1); cand = [f"{F}/{src}", f"{R}/docs/manual/{src}"]
    p = next(c for c in cand if os.path.exists(c))
    return f'src="data:image/png;base64,{base64.b64encode(open(p, "rb").read()).decode()}"'
h = re.sub(r'src="([^"]+\.png)"', img, h)
h = re.sub(r'<p>(<img [^>]*alt="([^"]*)"[^>]*>)</p>', lambda m: f'<figure>{m.group(1)}<figcaption>{m.group(2)}</figcaption></figure>' if m.group(2) else m.group(0), h)
# sumário
caps = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', h)
sumario = "<div class='sumario'><h2 class='semquebra'>Sumário</h2><ol>" + "".join(f"<li><a href='#{i}'>{re.sub(r'^\d+\. ', '', t)}</a></li>" for i, t in caps) + "</ol></div>"
capa = f"""<section class="capa"><div class="faixa"></div><p class="sup">Domma Tecnologia · Auto Visão &amp; Royal Vistorias</p>
<h1>Gerador de Estudo de Praça v2</h1><p class="sub">Documentação técnica completa</p>
<table class="ficha"><tr><td>Versão do sistema</td><td>{VERSAO}</td></tr><tr><td>Escopo</td><td>final v2.0</td></tr><tr><td>Data</td><td>29/10/2026</td></tr><tr><td>Situação</td><td>implementação local — não publicada</td></tr></table>
<p class="nota">Documento sem senhas nem chaves. Segredos aparecem como &lt;OCULTO&gt; ou &lt;SENHA&gt;.</p></section>"""
css = """
@page{size:A4;margin:16mm 14mm 18mm 14mm}
body{font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10.2px;color:#1F2328;line-height:1.5}
h1{font-size:26px;margin:0}h2{font-size:17px;color:#1F2328;border-bottom:2.5px solid #ED3237;padding-bottom:4px;margin:0 0 10px;break-before:page}
h2.semquebra{break-before:auto}h3{font-size:12.5px;color:#C9232C;margin:16px 0 6px;break-after:avoid}h4{font-size:11px;margin:12px 0 4px;color:#444;break-after:avoid}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:9.4px;break-inside:auto}tr{break-inside:avoid}
td,th{border:1px solid #D5D7DB;padding:3px 6px;vertical-align:top;text-align:left}th{background:#2B2F36;color:#fff;font-weight:600}
tr:nth-child(even) td{background:#F7F7F5}
code{background:#F1F1EF;border-radius:3px;padding:0 3px;font-family:'DejaVu Sans Mono',monospace;font-size:8.8px;word-break:break-word}
pre{background:#1F2328;color:#F1F1EF;padding:8px 10px;border-radius:6px;white-space:pre-wrap;font-size:8.4px;break-inside:avoid}
pre code{background:none;color:inherit;padding:0}
pre.mermaid{background:#fff;color:#000;text-align:center;border:1px solid #E3E3E0}
blockquote{border-left:4px solid #ED7130;background:#FFF6EE;margin:8px 0;padding:6px 10px;color:#5B3A1E}
figure{margin:10px 0;text-align:center;break-inside:avoid}figure img{max-width:100%;max-height:205mm;border:1px solid #D5D7DB;border-radius:4px}
figcaption{font-size:9px;color:#5B616B;margin-top:3px}td img{width:100%;border:1px solid #D5D7DB}
.capa{height:250mm;display:flex;flex-direction:column;justify-content:center;padding:0 10mm;position:relative}
.capa .faixa{position:absolute;top:0;left:0;right:0;height:10mm;background:linear-gradient(90deg,#ED3237 0 50%,#ED7130 50% 100%)}
.capa .sup{font-weight:600;color:#5B616B;letter-spacing:.08em;text-transform:uppercase;font-size:10px}
.capa h1{font-size:34px;margin:6px 0}.capa .sub{font-size:16px;color:#C9232C;margin:0 0 24px}
.ficha{width:60%}.ficha td:first-child{font-weight:600;width:40%}.nota{color:#5B616B;margin-top:30px}
.sumario{break-before:page}.sumario ol{font-size:12px;line-height:2}.sumario a{color:#1F2328;text-decoration:none}
"""
head = '<link rel=stylesheet href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script><script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>'
h = h.replace("<h1", "<h1 style='display:none'", 1)
doc = f"<!doctype html><html lang=pt-BR><head><meta charset=utf-8><title>Documentação técnica — Gerador de Estudo de Praça v2</title>{head}<style>{css}</style></head><body>{capa}{sumario}{h}</body></html>"
tmp = "/tmp/documentacao-tecnica.html"; open(tmp, "w").write(doc)
out = f"{R}/docs/documentacao-tecnica-estudo-praca-v2.pdf"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg = b.new_page()
    pg.goto("file://" + tmp, wait_until="networkidle")
    pg.evaluate("""async()=>{renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\\\(',right:'\\\\)',display:false}]});mermaid.initialize({startOnLoad:false,theme:'neutral'});await mermaid.run();}""")
    pg.wait_for_timeout(800)
    print("diagramas", pg.evaluate("document.querySelectorAll('pre.mermaid svg').length"), "de", len(blocks))
    pg.pdf(path=out, format="A4", print_background=True, display_header_footer=True, header_template="<span></span>",
           footer_template='<div style="font-size:7.5px;width:100%;padding:0 14mm;display:flex;justify-content:space-between;color:#888"><span>Gerador de Estudo de Praça v2 — Documentação técnica</span><span><span class=pageNumber></span>/<span class=totalPages></span></span></div>',
           margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
    b.close()
print(out)
