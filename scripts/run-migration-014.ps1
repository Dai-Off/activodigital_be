# Script para ejecutar la migración 014 - Agregar campos de imagen a energy_certificates
# Ejecutar este script desde la raíz del proyecto

Write-Host "Ejecutando migración 014: Agregar campos de imagen a energy_certificates..." -ForegroundColor Green

# Leer el contenido de la migración
$migrationPath = "database\migrations\014_add_image_fields_to_energy_certificates.sql"
$migrationContent = Get-Content $migrationPath -Raw

Write-Host "Contenido de la migración:" -ForegroundColor Yellow
Write-Host $migrationContent

Write-Host "`nIMPORTANTE:" -ForegroundColor Red
Write-Host "1. Ejecuta este SQL en tu base de datos de Supabase" -ForegroundColor White
Write-Host "2. Ve a tu proyecto de Supabase > SQL Editor" -ForegroundColor White
Write-Host "3. Pega y ejecuta el contenido de la migración" -ForegroundColor White
Write-Host "4. Verifica que las columnas se agregaron correctamente" -ForegroundColor White

Write-Host "`nUna vez ejecutada la migración, reinicia el backend para que los cambios tomen efecto." -ForegroundColor Green
