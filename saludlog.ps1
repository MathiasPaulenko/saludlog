# Arranca saludlog en modo desarrollo y abre el navegador.
Set-Location $PSScriptRoot

$port = 3000
$url = "http://localhost:$port"

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..."
    npm install
}

Write-Host "Aplicando migraciones..."
npm run db:migrate --silent

Start-Process $url
npm run dev
