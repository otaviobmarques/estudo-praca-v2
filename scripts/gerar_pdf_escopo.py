import markdown,sys,re,html
from playwright.sync_api import sync_playwright
src,out=sys.argv[1],sys.argv[2]
t=open(src).read()
blocks=[]
def keep(m):
    blocks.append(m.group(1)); return f"\n\nMERMAIDBLOCK{len(blocks)-1}\n\n"
t=re.sub(r"```mermaid\n(.*?)```",keep,t,flags=re.S)
maths=[]
t=re.sub(r"R\$(?=[\s/0-9])","RDOLARX",t)
def km(m):
    x=m.group(0)
    if not x.startswith("$$"): x="\\("+x[1:-1]+"\\)"
    maths.append(x); return f"MATHX{len(maths)-1}X"
_p=re.split(r"(```.*?```|`[^`\n]+`)",t,flags=re.S)
t="".join(x if i%2 else re.sub(r"\$\$.*?\$\$|\$[^$\n]+\$",km,x) for i,x in enumerate(_p))
h=markdown.markdown(t,extensions=['tables','fenced_code','sane_lists'])
for i,b in enumerate(blocks): h=h.replace(f"<p>MERMAIDBLOCK{i}</p>",f'<pre class="mermaid">{html.escape(b)}</pre>')
for i,m in enumerate(maths): h=h.replace(f"MATHX{i}X",html.escape(m))
h=h.replace("RDOLARX","R$")
css="body{font-family:Helvetica,Arial,sans-serif;font-size:10.5px;color:#1A1A1A;line-height:1.45}h1{color:#F20C1F;font-size:22px}h2{border-bottom:2px solid #F20C1F;padding-bottom:3px;margin-top:22px;font-size:16px}h3{font-size:13px}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #ccc;padding:3px 5px;vertical-align:top}th{background:#F4F4F4}code{background:#f4f4f4;font-size:9.5px;word-break:break-all}pre.mermaid{background:none;text-align:center}blockquote{color:#656565;border-left:3px solid #F20C1F;margin:0;padding-left:10px}"
head='<link rel=stylesheet href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script><script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>'
with sync_playwright() as p:
  b=p.chromium.launch(executable_path="/usr/bin/google-chrome");pg=b.new_page()
  open("/tmp/escopo.html","w").write(f"<!doctype html><html lang=pt-BR><head><meta charset=utf-8><title>Escopo v2.0</title>{head}<style>{css}</style></head><body>{h}</body></html>")
  pass
  pg.goto("file:///tmp/escopo.html",wait_until="networkidle")
  pg.evaluate("""async()=>{renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\\\(',right:'\\\\)',display:false}]});mermaid.initialize({startOnLoad:false});await mermaid.run();}""")
  pg.wait_for_timeout(500)
  print(pg.evaluate("document.querySelectorAll('pre.mermaid svg').length"),len(blocks),"katex",pg.evaluate("document.querySelectorAll('.katex').length"),pg.evaluate("typeof renderMathInElement"))
  pg.pdf(path=out,format='A4',margin={'top':'15mm','bottom':'15mm','left':'12mm','right':'12mm'},print_background=True,display_header_footer=True,header_template='<span></span>',footer_template='<div style="font-size:8px;width:100%;text-align:center;color:#888">Escopo final v2.0 — <span class=pageNumber></span>/<span class=totalPages></span></div>');b.close()
