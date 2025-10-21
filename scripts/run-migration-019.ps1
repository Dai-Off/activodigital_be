# Script para ejecutar la migración de notificaciones
# Ejecuta la migración 019_create_notifications_system.sql

Write-Host "Ejecutando migración de sistema de notificaciones..." -ForegroundColor Green

# Verificar que existe el archivo de migración
$migrationFile = "database/migrations/019_create_notifications_system.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: No se encontró el archivo de migración $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Archivo de migración encontrado: $migrationFile" -ForegroundColor Yellow

# Leer el contenido de la migración
$migrationContent = Get-Content $migrationFile -Raw

Write-Host "Contenido de la migración:" -ForegroundColor Cyan
Write-Host $migrationContent -ForegroundColor White

Write-Host "`nPara ejecutar esta migración, copia el contenido anterior y ejecútalo en tu cliente de PostgreSQL/Supabase." -ForegroundColor Yellow
Write-Host "O usa el comando psql si tienes acceso directo:" -ForegroundColor Yellow
Write-Host "psql -h tu-host -U tu-usuario -d tu-database -f $migrationFile" -ForegroundColor Cyan

Write-Host "`n✅ Migración lista para ejecutar!" -ForegroundColor Green
