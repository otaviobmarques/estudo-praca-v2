#!/usr/bin/env bash
# Teste de fumaça contra o servidor local. Uso: SENHA_ARQ=<arquivo com a senha> BASE=http://localhost:3100 tests/integracao/fumaca.sh
# Não imprime senha nem cookie.
set -u; BASE=${BASE:-http://localhost:3100}; J=/tmp/ep-cookies; rm -f $J; OUT=${OUT:-/tmp/ep-pdfs}; mkdir -p $OUT; falhas=0
ok(){ if [ "$1" = "$2" ]; then echo "OK   $3"; else echo "FALHA $3 (esperado $2, veio $1)"; falhas=$((falhas+1)); fi; }
S=$(cat "$SENHA_ARQ")
ok "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/v1/municipios?q=jo)" 401 "sem sessão a API recusa"
ok "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/relatorios -H 'content-type: application/json' -d '{}')" 401 "sem sessão o PDF recusa"
ok "$(curl -s -o /dev/null -w '%{http_code}' -c $J -X POST $BASE/api/v1/sessoes -H 'content-type: application/json' --data-binary @<(printf '{"identificador":"otavio","senha":"%s"}' "$S"))" 201 "login correto"
ok "$(curl -s -b $J $BASE/api/v1/municipios?q=joinvil | python3 -c 'import sys,json;d=json.load(sys.stdin)["itens"][0];print(d["nome"],d["uf"])')" "Joinville SC" "busca de município"
corpo(){ python3 - "$@" <<'PY'
import json,sys
m,mod,dre,lhb=sys.argv[1],sys.argv[2],sys.argv[3]=='1',(int(sys.argv[4]) if sys.argv[4]!='-' else None)
of={'full':dict(valorFranquia=30000,entrada=10000,parcelamento=True,numeroParcelas=20,valorParcela=1000),'home_based':dict(valorFranquia=15000,entrada=5000,parcelamento=True,numeroParcelas=10,valorParcela=1000)}[mod]
print(json.dumps(dict(marca=m,modelo=mod,cidade='Joinville',uf='SC',populacao=664541,frota=498378,cenario='provavel',percentuais=dict(conservador=1.5,provavel=2,otimista=2.5),percentualDetran=90,ticketDetran=147,ticketCautelar=280,ecvs=None,laudosHomeBased=lhb,incluirDre=dre,mesesDre=None,oferta=of,exemplo=True)))
PY
}
for m in auto-visao royal; do
  for v in "full 1 -" "full 0 -" "home_based 0 200" "home_based 1 200"; do set -- $v; f=$OUT/$m-$1-$2.pdf
    ok "$(curl -s -b $J -o $f -w '%{http_code}' -X POST $BASE/api/v1/relatorios -H 'content-type: application/json' -d "$(corpo $m $1 $2 $3)")" 200 "PDF $m $1 dre=$2"
    t=$(pdftotext $f - 2>/dev/null); p=$(pdfinfo $f | awk '/Pages/{print $2}')
    if [ $1 = home_based ]; then ok "$p" $((2+$2)) "  $((2+$2)) páginas"; ok "$(echo "$t" | grep -ciE 'detran|credenci|ecv')" 0 "  sem DETRAN/credenciamento/ECV"; ok "$(echo "$t" | grep -q 'R\$ 56.000' && echo sim)" sim "  faturamento 200 × R\$ 280";
    elif [ $2 = 1 ]; then ok "$p" 3 "  3 páginas"; ok "$(echo "$t" | grep -q '369.405,00' && echo sim)" sim "  EBITDA 10 meses R\$ 369.405,00"; ok "$(echo "$t" | grep -q '62,21%' && echo sim)" sim "  margem 62,21%"; ok "$(pdfinfo -f 2 -l 2 $f | awk '/Page +2 size/{print ($4>$6)?"deitada":"em pé"}')" deitada "  DRE em página deitada";
    else ok "$p" 2 "  2 páginas"; fi
    outra=$([ $m = royal ] && echo "Auto Visão" || echo "Royal"); ok "$(echo "$t" | grep -cw "$outra")" 0 "  não cita a outra marca"
  done
done
ok "$(curl -s -b $J -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/relatorios -H 'content-type: application/json' -d "$(corpo royal home_based 0 -)")" 422 "Home Based sem laudos bloqueia o PDF"
ok "$(curl -s -b $J -o /dev/null -w '%{content_type}' -X POST "$BASE/api/v1/relatorios?formato=png" -H 'content-type: application/json' -d "$(corpo auto-visao full 1 -)")" "image/png" "prévia em PNG"
R=$(curl -s -b $J $BASE/api/v1/rede | python3 -c 'import sys,json;d=json.load(sys.stdin);d=d.get("itens",d);r=[x for x in d if x["marca"]=="royal"][0] if isinstance(d,list) else d["royal"];print(json.dumps({k:r.get(k) or "" for k in ["destaque","lojas","estados","laudos_mes","frase_full","frase_home_based"]}))')
ok "$(curl -s -b $J -o /dev/null -w '%{http_code}' -X PUT $BASE/api/v1/rede/royal -H 'content-type: application/json' -d "$R")" 200 "administrador salva Sobre a rede (mesmos valores)"
ok "$(curl -s -o /dev/null -w '%{http_code}' -X PUT $BASE/api/v1/rede/royal -H 'content-type: application/json' -d "$R")" 401 "Sobre a rede sem sessão é recusado"
ok "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/senha/pedidos -H 'content-type: application/json' -d '{"email":"ninguem@exemplo.invalid"}')" 202 "esqueci a senha: resposta igual para e-mail inexistente"
ok "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/senha/redefinicoes -H 'content-type: application/json' -d '{"token":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","senha":"Expansao1","confirmacao":"Expansao1"}')" 410 "link inválido recusado"
for i in 1 2 3 4; do curl -s -o /dev/null -X POST $BASE/api/v1/sessoes -H 'content-type: application/json' -d '{"identificador":"otavio","senha":"errada"}'; done
ok "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/sessoes -H 'content-type: application/json' -d '{"identificador":"otavio","senha":"errada"}')" 429 "5ª senha errada bloqueia"
ok "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/sessoes -H 'content-type: application/json' --data-binary @<(printf '{"identificador":"otavio","senha":"%s"}' "$S"))" 429 "bloqueado mesmo com a senha certa (10 min)"
echo "falhas: $falhas"; exit $falhas
