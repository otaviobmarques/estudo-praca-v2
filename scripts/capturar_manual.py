"""Capturas reais do sistema local para o manual (docs/manual/capturas). Uso: SENHA_ARQ=<arquivo> python3 scripts/capturar_manual.py
A senha é lida do arquivo e nunca impressa; nenhuma tela capturada mostra senha."""
import os
from playwright.sync_api import sync_playwright
B=os.environ.get("BASE","http://localhost:3100"); O="docs/manual/capturas"; S=open(os.environ["SENHA_ARQ"]).read().strip()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto(B+"/entrar"); pg.wait_for_timeout(500); pg.screenshot(path=f"{O}/01-login.png")
    pg.goto(B+"/esqueci-senha"); pg.wait_for_timeout(500); pg.screenshot(path=f"{O}/02-esqueci-senha.png")
    pg.goto(B+"/redefinir-senha?token=exemplo-de-link-invalido-000000"); pg.wait_for_timeout(500); pg.screenshot(path=f"{O}/03-nova-senha.png")
    pg.goto(B+"/entrar"); pg.fill("#u","otavio"); pg.fill("#s",S); pg.click("button[type=submit]"); pg.wait_for_url(B+"/")
    pg.wait_for_selector("#b-exemplo"); pg.wait_for_timeout(600); pg.screenshot(path=f"{O}/04-painel-inicial.png")
    js=lambda c:pg.evaluate("(c)=>{const el=document.getElementById(c[0]);if(c[1]===null)el.checked=false;else if(c[1]===true)el.checked=true;else el.value=c[1];el.dispatchEvent(new Event('input',{bubbles:true}))}",c)
    pg.click("#b-exemplo"); pg.wait_for_timeout(800); pg.screenshot(path=f"{O}/05-full-exemplo-joinville.png", full_page=True)
    pg.evaluate("document.getElementById('g-dre').open=true"); pg.wait_for_timeout(400); pg.screenshot(path=f"{O}/06-full-com-dre.png", full_page=True)
    pg.goto(B+"/"); pg.wait_for_selector("#b-exemplo"); pg.wait_for_timeout(400)
    pg.click('.seletor-marca button[data-m="royal"]'); pg.click('.seletor-modelo button[data-mod="hb"]'); pg.click("#b-exemplo"); pg.wait_for_timeout(500)
    js(["d-on",True]); pg.evaluate("document.getElementById('g-dre').open=true"); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{O}/07-royal-home-based-com-dre.png", full_page=True)
    js(["f-lhb",""]); pg.wait_for_timeout(400); pg.screenshot(path=f"{O}/08-home-based-sem-laudos-bloqueado.png")
    pg.goto(B+"/admin"); pg.wait_for_selector("text=Salvar Auto Visão"); pg.wait_for_timeout(400); pg.screenshot(path=f"{O}/09-admin.png", full_page=True)
    b.close()
print("ok")
