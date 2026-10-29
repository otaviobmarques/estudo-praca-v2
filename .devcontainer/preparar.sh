#!/usr/bin/env bash
# Roda uma vez, quando o Codespace é criado: Chromium, fontes do relatório, dependências e .env.
set -euo pipefail
cd "$(dirname "$0")/.."
sudo apt-get update -qq
sudo apt-get install -y -qq chromium poppler-utils python3 fontconfig >/dev/null
# Fontes usadas pelos modelos da Julia (Inter, Nunito, Raleway), do repositório oficial do Google Fonts.
sudo mkdir -p /usr/local/share/fonts/estudo
for f in "inter/Inter%5Bopsz,wght%5D.ttf" "nunito/Nunito%5Bwght%5D.ttf" "raleway/Raleway%5Bwght%5D.ttf"; do
  sudo curl -fsSL -o "/usr/local/share/fonts/estudo/$(basename "$f" | sed 's/%5B.*//').ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/$f" || echo "aviso: fonte $f não baixada"
done
sudo fc-cache -f >/dev/null
npm ci
if [ ! -f .env ]; then
  # Senha do banco aleatória, gravada só no .env (fora do git), sem aparecer na tela.
  P=$(openssl rand -hex 16); sed "s/<SENHA>/$P/g" .env.example > .env; unset P
  sed -i "s|^APP_URL=.*|APP_URL=https://${CODESPACE_NAME:-local}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}|" .env
  sed -i 's|^# CHROME_PATH=.*|CHROME_PATH=/usr/bin/chromium|' .env
  chmod 600 .env
fi
