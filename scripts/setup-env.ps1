# Script para configurar variables de entorno para las Edge Functions
# Ejecutar desde el directorio raíz del proyecto

Write-Host "⚙️ Configurando variables de entorno para Supabase Edge Functions..." -ForegroundColor Green

# Verificar que Supabase CLI esté disponible
try {
    $version = npx supabase --version 2>$null
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no encontrado. Instalando..." -ForegroundColor Red
    npm install -g supabase
    exit 1
}

# Solicitar información del usuario
Write-Host ""
Write-Host "📋 Necesitamos la siguiente información:" -ForegroundColor Yellow

$projectRef = Read-Host "🔗 ID del proyecto de Supabase (ej: abcdefghijklmnop)"
$resendApiKey = Read-Host "🔑 API Key de Resend (obtén desde https://resend.com/api-keys)"
$frontendUrl = Read-Host "🌐 URL del frontend (ej: http://localhost:3000 o https://tu-dominio.com)"

# Validar inputs
if (-not $projectRef) {
    Write-Host "❌ ID del proyecto es requerido" -ForegroundColor Red
    exit 1
}

if (-not $resendApiKey) {
    Write-Host "❌ API Key de Resend es requerida" -ForegroundColor Red
    exit 1
}

if (-not $frontendUrl) {
    $frontendUrl = "http://localhost:3000"
    Write-Host "⚠️ Usando URL por defecto: $frontendUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Configurando variables de entorno..." -ForegroundColor Yellow

# Configurar variables de entorno en Supabase
try {
    # Configurar RESEND_API_KEY
    Write-Host "📧 Configurando RESEND_API_KEY..." -ForegroundColor Cyan
    npx supabase secrets set RESEND_API_KEY=$resendApiKey --project-ref $projectRef
    
    # Configurar FRONTEND_URL
    Write-Host "🌐 Configurando FRONTEND_URL..." -ForegroundColor Cyan
    npx supabase secrets set FRONTEND_URL=$frontendUrl --project-ref $projectRef
    
    Write-Host ""
    Write-Host "✅ Variables de entorno configuradas exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Variables configuradas:" -ForegroundColor Yellow
    Write-Host "   - RESEND_API_KEY: $($resendApiKey.Substring(0,8))..." -ForegroundColor Cyan
    Write-Host "   - FRONTEND_URL: $frontendUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
    Write-Host "💡 Ahora puedes desplegar las funciones con: .\scripts\deploy-functions.ps1" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error configurando variables de entorno: $_" -ForegroundColor Red
    Write-Host "💡 Asegúrate de estar autenticado con Supabase: npx supabase login" -ForegroundColor Yellow
    exit 1
}
