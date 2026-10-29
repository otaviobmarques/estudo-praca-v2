"""Captura a tela do sistema (servidor local) nos estados das prévias da Julia e monta a comparação lado a lado.
Uso: SENHA_ARQ=<arquivo> python3 scripts/capturar_tela.py  (a senha não é impressa)"""
import os,json
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops,ImageDraw
B=os.environ.get("BASE","http://localhost:3100"); J="/home/box/redbox/clientes/auto-visao/estudo-praca/design/tela"; O="docs/comparacao"
S=open(os.environ["SENHA_ARQ"]).read().strip(); res={}
ESTADOS=[("full_dre-off",None),("full_dre-ok",None),("full_dre-vazio",None),("home-based_preenchido",None),("home-based_vazio",None)]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto(B+"/entrar"); pg.fill("#u","otavio"); pg.fill("#s",S); pg.click("button[type=submit]"); pg.wait_for_url(B+"/")
    for m in ["auto-visao","royal"]:
        for e,_ in ESTADOS:
            pg.goto(B+"/"); pg.wait_for_selector("#b-exemplo"); pg.wait_for_timeout(400)
            pg.click(f'.seletor-marca button[data-m="{m}"]')
            if e.startswith("home"): pg.click('.seletor-modelo button[data-mod="hb"]')
            pg.click("#b-exemplo")
            js=lambda c:pg.evaluate("(c)=>{const el=document.getElementById(c[0]);if(c[1]===null)el.checked=false;else el.value=c[1];el.dispatchEvent(new Event('input',{bubbles:true}))}",c)
            if e=="full_dre-off": js(["d-on",None])
            if e=="full_dre-vazio": js(["d-lu",""])
            if e=="home-based_vazio": js(["f-lhb",""])
            if "dre" in e and e!="full_dre-off": pg.evaluate("document.getElementById('g-dre').open=true")
            pg.wait_for_timeout(300); f=f"/tmp/tela_{m}_{e}.png"; pg.screenshot(path=f,full_page=True)
            a=Image.open(f).convert("RGB"); jf=f"{J}/previa-tela_{m}_{e}.png"; j=Image.open(jf).convert("RGB")
            w=720; a=a.resize((w,int(a.height*w/a.width))); j=j.resize((w,int(j.height*w/j.width))); h=max(a.height,j.height)
            jj=Image.new("RGB",(w,h),"white"); jj.paste(j); aa=Image.new("RGB",(w,h),"white"); aa.paste(a)
            d=ImageChops.difference(aa,jj).convert("L").point(lambda x:255 if x>40 else 0); pct=round(100*sum(1 for x in d.getdata() if x)/(w*h),1)
            im=Image.new("RGB",(3*w+20,h+24),"white"); dr=ImageDraw.Draw(im)
            for k,(t,x) in enumerate([("Julia (aprovado)",jj),("Sistema",aa),(f"Diferença: {pct}%",Image.merge("RGB",(d,Image.new("L",(w,h)),Image.new("L",(w,h)))))]): im.paste(x,(k*(w+10),24)); dr.text((k*(w+10)+4,6),t,fill="black")
            out=f"{O}/comparacao-tela_{m}_{e}.png"; im.save(out); res[f"{m}_{e}"]=pct; print(m,e,pct)
    # administração: Sobre a rede
    pg.goto(B+"/admin"); pg.wait_for_selector("text=Salvar Auto Visão"); pg.screenshot(path=f"{O}/tela-admin-sobre-a-rede.png",full_page=True)
    b.close()
json.dump(res,open(f"{O}/resumo-tela.json","w"),indent=1)
