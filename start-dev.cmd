@echo off
echo 🚀 INICIANDO AXS360 EN MODO DESARROLLO...
echo.

REM Verificar que las dependencias estén instaladas
if not exist "node_modules" (
    echo ❌ Dependencias no instaladas. Ejecutando instalacion...
    call install-everything.cmd
)

REM Verificar configuración
echo 🔍 Verificando configuracion...
call validate-config.cmd
if errorlevel 1 (
    echo ❌ Configuracion invalida. Por favor configura los archivos .env
    pause
    exit /b 1
)

echo.
echo 🎯 Iniciando servicios...

REM Iniciar Backend Python
echo 🐍 Iniciando Backend Python (Puerto 8000)...
start "AXS360 Backend" cmd /k "cd backend-python && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Esperar un poco para que el backend inicie
timeout /t 3 /nobreak > nul

REM Iniciar Frontend Principal
echo ⚛️  Iniciando Frontend Principal (Puerto 5173)...
start "AXS360 Frontend" cmd /k "npm run dev"

REM Esperar un poco
timeout /t 2 /nobreak > nul

REM Iniciar Landing Page
echo 🌐 Iniciando Landing Page (Puerto 3000)...
start "AXS360 Landing" cmd /k "cd landing-page && npm run dev"

REM Esperar un poco
timeout /t 2 /nobreak > nul

REM Iniciar Business Dashboard
echo 🏢 Iniciando Business Dashboard (Puerto 3001)...
start "AXS360 Dashboard" cmd /k "cd business-dashboard && npm run dev"

echo.
echo ✅ TODOS LOS SERVICIOS INICIADOS!
echo.
echo 📍 URLs disponibles:
echo    🎯 Frontend Principal: http://localhost:5173
echo    🌐 Landing Page:       http://localhost:3000
echo    🏢 Business Dashboard: http://localhost:3001
echo    🔧 Backend API:        http://localhost:8000
echo    📚 API Docs:           http://localhost:8000/docs
echo.
echo 💡 Para detener todos los servicios, cierra las ventanas de terminal
echo    o presiona Ctrl+C en cada una.
echo.
echo 🎉 AXS360 está ejecutándose en modo desarrollo!
pause
