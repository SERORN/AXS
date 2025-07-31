@echo off
echo 🔧 INSTALANDO TODA LA PLATAFORMA AXS360...
echo.

echo ⚡ Este script instalará automáticamente:
echo    📦 Dependencias Node.js del frontend
echo    🐍 Entorno virtual Python del backend  
echo    🌐 Dependencias de Landing Page
echo    🏢 Dependencias de Business Dashboard
echo    📱 Configuración de Mobile App
echo.

pause

REM Verificar Node.js
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no esta instalado
    echo 📥 Descarga desde: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado
)

REM Verificar Python
echo 🔍 Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no esta instalado
    echo 📥 Descarga desde: https://python.org
    pause
    exit /b 1
) else (
    echo ✅ Python encontrado
)

echo.
echo 📦 PASO 1: Instalando dependencias del Frontend Principal...
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias principales
    pause
    exit /b 1
)
echo ✅ Frontend principal instalado

echo.
echo 🐍 PASO 2: Configurando Backend Python...
cd backend-python

REM Crear entorno virtual si no existe
if not exist "venv" (
    echo 🔧 Creando entorno virtual Python...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Error creando entorno virtual
        cd ..
        pause
        exit /b 1
    )
)

REM Activar entorno virtual e instalar dependencias
echo 📦 Instalando dependencias Python...
call venv\Scripts\activate && pip install --upgrade pip && pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error instalando dependencias Python
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend Python configurado
cd ..

echo.
echo 🌐 PASO 3: Configurando Landing Page...
cd landing-page
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Landing Page
    cd ..
    pause
    exit /b 1
)
echo ✅ Landing Page configurada
cd ..

echo.
echo 🏢 PASO 4: Configurando Business Dashboard...
cd business-dashboard
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Business Dashboard
    cd ..
    pause
    exit /b 1
)
echo ✅ Business Dashboard configurado
cd ..

echo.
echo 📱 PASO 5: Configurando Mobile App...
cd mobile-app
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Mobile App
    cd ..
    pause
    exit /b 1
)
echo ✅ Mobile App configurado
cd ..

echo.
echo 📄 PASO 6: Creando archivos de configuracion...

REM Crear .env si no existe
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ .env creado desde .env.example
    ) else (
        echo 🔑 .env.example no encontrado, creando .env básico...
        echo # AXS360 Configuration > .env
        echo VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE >> .env
        echo VITE_API_URL=http://localhost:8000 >> .env
    )
) else (
    echo ✅ .env ya existe
)

REM Crear backend .env si no existe  
if not exist "backend-python\.env" (
    if exist "backend-python\.env.example" (
        copy "backend-python\.env.example" "backend-python\.env"
        echo ✅ backend-python\.env creado desde .env.example
    ) else (
        echo 🔑 Creando backend-python\.env básico...
        echo # Backend Configuration > backend-python\.env
        echo DATABASE_URL=postgresql://username:password@localhost:5432/axs360_db >> backend-python\.env
        echo SECRET_KEY=tu_clave_super_secreta_de_minimo_32_caracteres_aqui >> backend-python\.env
    )
) else (
    echo ✅ backend-python\.env ya existe
)

REM Crear otros .env si no existen
if not exist "landing-page\.env.local" (
    echo # Landing Page Configuration > landing-page\.env.local
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> landing-page\.env.local
    echo ✅ landing-page\.env.local creado
)

if not exist "business-dashboard\.env.local" (
    echo # Dashboard Configuration > business-dashboard\.env.local
    echo NEXTAUTH_SECRET=tu_clave_secreta_nextauth >> business-dashboard\.env.local
    echo NEXTAUTH_URL=http://localhost:3001 >> business-dashboard\.env.local
    echo ✅ business-dashboard\.env.local creado
)

echo.
echo 🎉 INSTALACION COMPLETADA EXITOSAMENTE!
echo.
echo 📋 RESUMEN:
echo    ✅ Frontend Principal - Dependencias instaladas
echo    ✅ Backend Python - Entorno virtual configurado  
echo    ✅ Landing Page - Dependencias instaladas
echo    ✅ Business Dashboard - Dependencias instaladas
echo    ✅ Mobile App - Dependencias instaladas
echo    ✅ Archivos .env - Creados con valores por defecto
echo.
echo 🔑 SIGUIENTE PASO: Configurar credenciales
echo    1. Lee: CREDENCIALES_NECESARIAS.md
echo    2. Configura los archivos .env con tus credenciales reales
echo    3. Ejecuta: validate-config.cmd para verificar
echo    4. Ejecuta: start-dev.cmd para iniciar todo
echo.
echo 💡 Para ayuda: README.md o CREDENCIALES_NECESARIAS.md
pause
