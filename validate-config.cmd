@echo off
echo 🔍 VALIDANDO CONFIGURACION DE AXS360...
echo.

set "error_count=0"

echo ✅ Verificando archivos de configuracion...

REM Verificar archivo .env principal
if not exist ".env" (
    echo ❌ FALTA: .env ^(archivo principal^)
    echo    ➤ Copia .env.example y configuralo
    set /a error_count+=1
) else (
    echo ✅ .env encontrado
)

REM Verificar backend .env
if not exist "backend-python\.env" (
    echo ❌ FALTA: backend-python\.env
    echo    ➤ Copia backend-python\.env.example y configuralo
    set /a error_count+=1
) else (
    echo ✅ backend-python\.env encontrado
)

REM Verificar landing page .env
if not exist "landing-page\.env.local" (
    echo ❌ FALTA: landing-page\.env.local
    echo    ➤ Copia landing-page\.env.example y configuralo
    set /a error_count+=1
) else (
    echo ✅ landing-page\.env.local encontrado
)

REM Verificar dashboard .env
if not exist "business-dashboard\.env.local" (
    echo ❌ FALTA: business-dashboard\.env.local
    echo    ➤ Copia business-dashboard\.env.example y configuralo
    set /a error_count+=1
) else (
    echo ✅ business-dashboard\.env.local encontrado
)

echo.
echo 🔍 Verificando dependencias instaladas...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no esta instalado
    echo    ➤ Instala Node.js desde: https://nodejs.org
    set /a error_count+=1
) else (
    echo ✅ Node.js instalado
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no esta instalado
    echo    ➤ Instala Python desde: https://python.org
    set /a error_count+=1
) else (
    echo ✅ Python instalado
)

REM Verificar npm packages en root
if not exist "node_modules" (
    echo ⚠️  Dependencias principales no instaladas
    echo    ➤ Ejecuta: npm install
    set /a error_count+=1
) else (
    echo ✅ Dependencias principales instaladas
)

REM Verificar backend packages
if not exist "backend-python\venv" (
    echo ⚠️  Entorno virtual Python no creado
    echo    ➤ Ejecuta: install-everything.cmd
    set /a error_count+=1
) else (
    echo ✅ Entorno virtual Python creado
)

echo.
echo 🔍 Verificando puertos disponibles...

REM Verificar si los puertos estan libres
netstat -an | find ":5173" >nul
if not errorlevel 1 (
    echo ⚠️  Puerto 5173 en uso ^(Frontend^)
)

netstat -an | find ":8000" >nul
if not errorlevel 1 (
    echo ⚠️  Puerto 8000 en uso ^(Backend^)
)

netstat -an | find ":3000" >nul
if not errorlevel 1 (
    echo ⚠️  Puerto 3000 en uso ^(Landing^)
)

netstat -an | find ":3001" >nul
if not errorlevel 1 (
    echo ⚠️  Puerto 3001 en uso ^(Dashboard^)
)

echo.
echo 📊 RESUMEN DE VALIDACION:

if %error_count%==0 (
    echo ✅ TODO LISTO! La configuracion es valida
    echo.
    echo 🚀 Puedes ejecutar: start-dev.cmd
    echo.
    echo 📍 URLs disponibles:
    echo    - Frontend: http://localhost:5173
    echo    - Backend:  http://localhost:8000
    echo    - Landing:  http://localhost:3000
    echo    - Dashboard: http://localhost:3001
) else (
    echo ❌ Se encontraron %error_count% problemas
    echo.
    echo 📋 Para solucionarlos:
    echo    1. Lee: CREDENCIALES_NECESARIAS.md
    echo    2. Configura los archivos .env faltantes
    echo    3. Ejecuta: install-everything.cmd
    echo    4. Vuelve a ejecutar: validate-config.cmd
)

echo.
echo ℹ️  Para ayuda detallada, lee: CREDENCIALES_NECESARIAS.md
pause
