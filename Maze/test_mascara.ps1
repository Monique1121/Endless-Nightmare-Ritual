# ========================================
# Script de Prueba - Máscara de Luz
# ========================================

# INSTRUCCIONES:
# 1. Asegúrate de que el servidor API esté corriendo (npm start en /api)
# 2. Cambia el $playerId por el ID del jugador que quieres probar
# 3. Ejecuta este script en PowerShell

$playerId = 1
$apiUrl = "http://localhost:3000/api"

Write-Host "🧪 Probando sistema de máscara de luz y cofres..." -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. Verificar si el jugador existe
# ========================================
Write-Host "📋 Paso 1: Verificando jugador..." -ForegroundColor Yellow
try {
    $playerResponse = Invoke-WebRequest -Uri "$apiUrl/player/$playerId" -Method GET
    $playerData = $playerResponse.Content | ConvertFrom-Json
    
    if ($playerData.success) {
        Write-Host "   ✅ Jugador encontrado: $($playerData.player.Player_name)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error: Jugador no encontrado" -ForegroundColor Red
    exit
}

# ========================================
# 2. Verificar si ya tiene la máscara
# ========================================
Write-Host ""
Write-Host "📋 Paso 2: Verificando máscara de luz..." -ForegroundColor Yellow
try {
    $maskResponse = Invoke-WebRequest -Uri "$apiUrl/player/$playerId/item/mascara_luz" -Method GET
    $maskData = $maskResponse.Content | ConvertFrom-Json
    
    if ($maskData.hasItem) {
        Write-Host "   ℹ️  El jugador YA tiene la máscara de luz" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚪ El jugador NO tiene la máscara de luz" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Error al verificar máscara" -ForegroundColor Yellow
}

# ========================================
# 3. Dar la máscara de luz
# ========================================
Write-Host ""
Write-Host "📋 Paso 3: Entregando máscara de luz..." -ForegroundColor Yellow
try {
    $giveResponse = Invoke-WebRequest -Uri "$apiUrl/player/$playerId/item/mascara_luz/give" -Method POST
    $giveData = $giveResponse.Content | ConvertFrom-Json
    
    if ($giveData.success) {
        Write-Host "   ✅ Máscara de luz entregada correctamente" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error al dar la máscara" -ForegroundColor Red
}

# ========================================
# 4. Verificar nuevamente
# ========================================
Write-Host ""
Write-Host "📋 Paso 4: Verificando cambios..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-WebRequest -Uri "$apiUrl/player/$playerId/item/mascara_luz" -Method GET
    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    
    if ($verifyData.hasItem) {
        Write-Host "   ✅ CONFIRMADO: El jugador ahora tiene la máscara de luz" -ForegroundColor Green
        Write-Host "   📅 Obtenido: $($verifyData.item.Obtained_at)" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Algo salió mal, la máscara no se guardó" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error en verificación final" -ForegroundColor Red
}

# ========================================
# 5. Ver cofres abiertos
# ========================================
Write-Host ""
Write-Host "📋 Paso 5: Consultando cofres abiertos..." -ForegroundColor Yellow
try {
    $chestsResponse = Invoke-WebRequest -Uri "$apiUrl/player/$playerId/chests/opened" -Method GET
    $chestsData = $chestsResponse.Content | ConvertFrom-Json
    
    $count = $chestsData.openedChests.Count
    Write-Host "   📦 Cofres abiertos: $count" -ForegroundColor Cyan
    
    if ($count -gt 0) {
        Write-Host "   IDs: $($chestsData.openedChests -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  No se pudieron cargar los cofres" -ForegroundColor Yellow
}

# ========================================
# Resumen
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBA COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Inicia sesión en el juego con el usuario asociado al jugador $playerId"
Write-Host "2. Entra al laberinto desde el lobby"
Write-Host "3. Observa el efecto de máscara de luz (oscuridad radial)"
Write-Host "4. Busca cofres en los callejones sin salida"
Write-Host "5. Camina sobre un cofre para abrirlo"
Write-Host "6. Sal y vuelve a entrar - el cofre debe seguir abierto"
Write-Host ""
Write-Host "💡 Tip: Presiona F12 en el navegador para ver los logs de recompensas" -ForegroundColor Cyan
Write-Host ""
