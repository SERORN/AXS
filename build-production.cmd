@echo off
echo 📦 CONSTRUYENDO AXS360 PARA PRODUCCIÓN...
echo.

REM Verificar que las dependencias estén instaladas
if not exist "node_modules" (
    echo ❌ Dependencias no instaladas. Ejecutando instalacion...
    call install-everything.cmd
)

echo 🔍 Verificando configuracion de produccion...

REM Verificar archivos .env existen
if not exist ".env" (
    echo ❌ FALTA: .env - Configura las credenciales de produccion
    pause
    exit /b 1
)

if not exist "backend-python\.env" (
    echo ❌ FALTA: backend-python\.env - Configura el backend
    pause
    exit /b 1
)

echo.
echo 🏗️  Construyendo componentes...

REM Limpiar builds anteriores
echo 🧹 Limpiando builds anteriores...
if exist "dist" rmdir /s /q dist
if exist "landing-page\.next" rmdir /s /q landing-page\.next
if exist "business-dashboard\.next" rmdir /s /q business-dashboard\.next

REM Build Frontend Principal
echo ⚛️  Construyendo Frontend Principal...
call npm run build
if errorlevel 1 (
    echo ❌ Error construyendo frontend principal
    pause
    exit /b 1
)

REM Build Landing Page
echo 🌐 Construyendo Landing Page...
cd landing-page
call npm run build
if errorlevel 1 (
    echo ❌ Error construyendo landing page
    cd ..
    pause
    exit /b 1
)
cd ..

REM Build Business Dashboard
echo 🏢 Construyendo Business Dashboard...
cd business-dashboard
call npm run build
if errorlevel 1 (
    echo ❌ Error construyendo business dashboard
    cd ..
    pause
    exit /b 1
)
cd ..

REM Build Mobile Apps
echo 📱 Construyendo Mobile Apps...
cd mobile-app

echo 🤖 Construyendo Android APK...
if exist "android" (
    cd android
    call .\gradlew assembleRelease
    if errorlevel 1 (
        echo ⚠️  Error construyendo Android APK (continuando...)
    ) else (
        echo ✅ Android APK construido: android\app\build\outputs\apk\release\app-release.apk
    )
    cd ..
)

echo 🍎 Preparando iOS Build...
if exist "ios" (
    echo ℹ️  Para iOS: Abre ios\AXS360.xcworkspace en Xcode y construye manualmente
    echo    O ejecuta: cd ios && xcodebuild -workspace AXS360.xcworkspace -scheme AXS360 -configuration Release
)

cd ..

echo.
echo ✅ CONSTRUCCION COMPLETADA!
echo.
echo 📦 Archivos de produccion generados:
echo    📁 Frontend: dist/
echo    📁 Landing: landing-page/.next/
echo    📁 Dashboard: business-dashboard/.next/
echo    📱 Android: mobile-app/android/app/build/outputs/apk/release/
echo    🍎 iOS: Construir manualmente en Xcode
echo.
echo 🚀 SIGUIENTE PASO: Deployment
echo    1. Sube dist/ a tu servidor web (Netlify, Vercel, etc.)
echo    2. Sube landing-page/.next/ para la landing page
echo    3. Sube business-dashboard/.next/ para el dashboard
echo    4. Configura el backend Python en tu servidor (Railway, Heroku, etc.)
echo    5. Sube las apps móviles a Google Play / App Store
echo.
echo 📚 Guía completa en: DEPLOYMENT_GUIDE.md
pause
