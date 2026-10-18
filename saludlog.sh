#!/usr/bin/env bash
# Arranca saludlog en modo desarrollo y abre el navegador.
cd "$(dirname "$0")" || exit 1

PORT=3000
URL="http://localhost:$PORT"

if [ ! -d node_modules ]; then
  echo "Instalando dependencias..."
  npm install
fi

echo "Aplicando migraciones..."
npm run db:migrate --silent

case "$(uname -s)" in
  Darwin*) open "$URL" ;;
  MINGW*|MSYS*|CYGWIN*) start "" "$URL" ;;
  Linux*) xdg-open "$URL" ;;
esac

npm run dev
