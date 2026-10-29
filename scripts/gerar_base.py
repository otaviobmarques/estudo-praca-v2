"""Gera dados/municipios.json a partir das bases oficiais (Senatran set/2026 + IBGE Estimativa 2025).
Liga a frota (sem código) à população pelo par UF + nome normalizado. Divergências vão para dados/divergencias.json.
Uso: python3 scripts/gerar_base.py <frota.xlsx> <populacao.xls>"""
import sys,json,unicodedata,re,hashlib,datetime,openpyxl,xlrd
fx,px=sys.argv[1],sys.argv[2]
def norm(t):
    t=unicodedata.normalize('NFKD',str(t)).encode('ascii','ignore').decode().upper()
    t=re.sub(r"[^A-Z0-9 ]"," ",t.replace("'"," "));return re.sub(r"\s+"," ",t).strip()
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
EXC={k:v for k,v in json.load(open('dados/excecoes-nomes.json')).items() if not k.startswith('_')}
wb=openpyxl.load_workbook(fx,read_only=True);ws=wb.active
assert 'SETEMBRO/2026' in str(next(ws.iter_rows(values_only=True))[0]), 'título da frota inesperado'
rows=list(ws.iter_rows(values_only=True));cab=None;frota={};descart=[]
for r in rows:
    if r[0]=='UF' and r[1]=='MUNICIPIO': cab=list(r);continue
    if cab and r[0] and r[1] and isinstance(r[2],(int,float)):
        if 'NAO INFORMADO' in str(r[1]): descart.append(f"{r[0]} - {r[1]}");continue
        tipos={cab[i]:int(r[i] or 0) for i in range(3,len(cab)) if cab[i]}
        n=EXC.get(f"{r[0]}|{r[1]}") or EXC.get(f"{r[0]}|{norm(r[1])}") or norm(r[1])
        frota[(r[0],n)]={'total':int(r[2]),'tipos':tipos,'nome_senatran':r[1]}
assert cab and cab[:3]==['UF','MUNICIPIO','TOTAL'] and len(cab)==24, 'cabeçalho da frota inesperado'
b=xlrd.open_workbook(px);s=b.sheet_by_name('Municípios');pop={}
for i in range(s.nrows):
    v=s.row_values(i)
    cu=str(v[1]).replace('.0','').strip(); cm=str(v[2]).replace('.0','').strip()
    if i>1 and cu.isdigit() and cm.isdigit() and len(str(v[0]))==2:
        # Algumas linhas trazem a população com nota de rodapé, ex.: "53.014(1)"; guardamos só o número.
        pv=v[4] if isinstance(v[4],(int,float)) else int(re.sub(r"\(.*?\)","",str(v[4])).replace('.','').strip())
        cod=f"{int(cu):02d}{cm.zfill(5)}"
        pop[(v[0],norm(v[3]))]={'cod_ibge':cod,'nome':v[3],'uf':v[0],'populacao':int(pv)}
mun=[];sem_frota=[]
for k,p in pop.items():
    f=frota.pop(k,None)
    if not f: sem_frota.append(f"{p['uf']} - {p['nome']}");continue
    mun.append({**p,'nome_normalizado':k[1],'frota_total':f['total'],'frota_tipos':f['tipos']})
sem_pop=[f"{k[0]} - {v['nome_senatran']}" for k,v in frota.items()]
mun.sort(key=lambda m:m['cod_ibge'])
meta={'frota':{'fonte':'Senatran – Frota por município e tipo – Setembro/2026','arquivo':fx.split('/')[-1],'sha256':sha(fx)},
 'populacao':{'fonte':'Estimativa IBGE 2025 (referência 1º/07/2025)','arquivo':px.split('/')[-1],'sha256':sha(px)},
 'gerado_em':datetime.datetime.now().isoformat(timespec='seconds'),'municipios_ligados':len(mun),
 'municipios_ibge':len(pop),'soma_populacao':sum(p['populacao'] for p in pop.values()),
 'soma_frota_ligada':sum(m['frota_total'] for m in mun)}
json.dump({'meta':meta,'municipios':mun},open('dados/municipios.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump({'descartados':descart,'ibge_sem_frota':sem_frota,'senatran_sem_ibge':sem_pop},open('dados/divergencias.json','w'),ensure_ascii=False,indent=1)
assert len(mun)==5571 and not sem_frota and not sem_pop, 'ligação incompleta: veja dados/divergencias.json'
print(json.dumps(meta,ensure_ascii=False,indent=1));print('sem frota:',len(sem_frota),'sem ibge:',len(sem_pop))
