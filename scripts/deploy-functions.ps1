# Script para desplegar las Edge Functions de Supabase
# Ejecutar desde el directorio raíz del proyecto

Write-Host "🚀 Desplegando Edge Functions de Supabase..." -ForegroundColor Green

# Verificar que Supabase CLI esté instalado
try {
    $version = npx supabase --version 2>$null
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no encontrado. Instalando..." -ForegroundColor Red
    npm install -g supabase
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "supabase/functions")) {
    Write-Host "❌ No se encontró la carpeta supabase/functions. Ejecuta desde el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

Write-Host "📧 Desplegando función send-invitation-email..." -ForegroundColor Yellow
npx supabase functions deploy send-invitation-email --project-ref $env:SUPABASE_PROJECT_REF

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-invitation-email desplegada exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error desplegando send-invitation-email" -ForegroundColor Red
}

Write-Host "📧 Desplegando función send-welcome-email..." -ForegroundColor Yellow
npx supabase functions deploy send-welcome-email --project-ref $env:SUPABASE_PROJECT_REF

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-welcome-email desplegada exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error desplegando send-welcome-email" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Despliegue completado!" -ForegroundColor Green
Write-Host "📝 Recuerda configurar las variables de entorno en el dashboard de Supabase:" -ForegroundColor Yellow
Write-Host "   - RESEND_API_KEY" -ForegroundColor Cyan
Write-Host "   - FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Las funciones estarán disponibles en:" -ForegroundColor Yellow
Write-Host "   https://$env:SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-invitation-email" -ForegroundColor Cyan
Write-Host "   https://$env:SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-welcome-email" -ForegroundColor Cyan
