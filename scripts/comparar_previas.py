"""Compara os PDFs gerados pelo sistema com os modelos aprovados da Julia (design/relatorio/relatorio-modelo_*.pdf).
Gera, por página, uma imagem lado a lado (Julia | sistema | diferença) e um resumo com o % de pixels diferentes."""
import subprocess,sys,os,glob,json
from PIL import Image,ImageChops,ImageDraw
J="/home/box/redbox/clientes/auto-visao/estudo-praca/design/relatorio"; S="docs/exemplos"; O="docs/comparacao"; T="/tmp/cmp"
os.makedirs(T,exist_ok=True); res={}
def pags(pdf,pre):
    for f in glob.glob(f"{T}/{pre}-*.png"): os.remove(f)
    subprocess.run(["pdftoppm","-r","60","-png",pdf,f"{T}/{pre}"],check=True); return sorted(glob.glob(f"{T}/{pre}-*.png"))
for m in ["auto-visao","royal"]:
  for jn,sn in [("full_sem-dre","full_sem-dre"),("full_com-dre","full_com-dre"),("home-based","home-based_sem-dre"),(None,"home-based_com-dre")]:
    sp=pags(f"{S}/relatorio_{m}_{sn}.pdf","s"); jp=pags(f"{J}/relatorio-modelo_{m}_{jn}.pdf","j") if jn else []
    linha=[]
    for i,s in enumerate(sp):
        a=Image.open(s).convert("RGB"); w,h=a.size
        if i<len(jp):
            b=Image.open(jp[i]).convert("RGB").resize((w,h)); d=ImageChops.difference(a,b).convert("L").point(lambda x:255 if x>40 else 0)
            p=round(100*sum(1 for x in d.getdata() if x)/ (w*h),1); dif=Image.merge("RGB",(d,Image.new("L",(w,h)),Image.new("L",(w,h))))
            tiles=[("Julia (aprovado)",b),("Sistema",a),(f"Diferença: {p}% dos pixels",dif)]
        else: p=None; tiles=[("Sem modelo da Julia (novo)",Image.new("RGB",(w,h),"white")),("Sistema",a)]
        im=Image.new("RGB",(len(tiles)*(w+10),h+24),"white"); dr=ImageDraw.Draw(im)
        for k,(t,x) in enumerate(tiles): im.paste(x,(k*(w+10),24)); dr.text((k*(w+10)+4,6),t,fill="black")
        f=f"{O}/comparacao_{m}_{sn}_p{i+1}.png"; im.save(f); linha.append({"pagina":i+1,"pixels_diferentes_pct":p,"imagem":f})
    res[f"{m}_{sn}"]=linha
json.dump(res,open(f"{O}/resumo.json","w"),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,[x["pixels_diferentes_pct"] for x in v])
