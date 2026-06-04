# Sube finapp a GitHub (cuenta gerson0527)
# Ejecutar en PowerShell desde la raíz del proyecto: .\scripts\push-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Instala GitHub CLI: winget install GitHub.cli" -ForegroundColor Yellow
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Inicia sesión en GitHub (se abrirá el navegador)..." -ForegroundColor Cyan
  gh auth login -h github.com -p https -w
}

Write-Host "Creando repo y subiendo código..." -ForegroundColor Cyan
gh repo create finapp --private --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
  Write-Host "Listo. Repo: https://github.com/gerson0527/finapp" -ForegroundColor Green
} else {
  Write-Host "Si el repo ya existe, prueba: git push -u origin master" -ForegroundColor Yellow
}
