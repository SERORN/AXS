@echo off
echo 🗃️  CONFIGURANDO BASE DE DATOS POSTGRESQL...
echo.

echo 💡 Este script te ayudará a configurar PostgreSQL para AXS360
echo.

REM Verificar si PostgreSQL está instalado
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL no está instalado localmente
    echo.
    echo 🎯 OPCIONES RECOMENDADAS:
    echo.
    echo 1. 🌐 USAR NEON.TECH (GRATIS)
    echo    - Ir a: https://neon.tech
    echo    - Crear cuenta gratuita  
    echo    - Crear base de datos
    echo    - Copiar la CONNECTION STRING
    echo.
    echo 2. 📦 INSTALAR POSTGRESQL LOCAL
    echo    - Ir a: https://www.postgresql.org/download/windows/
    echo    - Descargar e instalar PostgreSQL
    echo    - Volver a ejecutar este script
    echo.
    echo 3. 🐳 USAR DOCKER
    echo    - docker run --name axs360-postgres -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -d postgres
    echo.
    pause
    exit /b 0
) else (
    echo ✅ PostgreSQL encontrado localmente
)

echo.
echo 🔧 Configurando base de datos local...

REM Solicitar credenciales
set /p DB_NAME="Nombre de la base de datos [axs360_db]: "
if "%DB_NAME%"=="" set DB_NAME=axs360_db

set /p DB_USER="Usuario de PostgreSQL [postgres]: "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Contraseña de PostgreSQL: "
if "%DB_PASSWORD%"=="" (
    echo ❌ La contraseña es obligatoria
    pause
    exit /b 1
)

set /p DB_HOST="Host [localhost]: "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Puerto [5432]: "
if "%DB_PORT%"=="" set DB_PORT=5432

echo.
echo 🔍 Probando conexión...

REM Probar conexión
echo \q | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres 2>nul
if errorlevel 1 (
    echo ❌ No se pudo conectar a PostgreSQL
    echo    Verifica las credenciales y que PostgreSQL esté ejecutándose
    pause
    exit /b 1
)

echo ✅ Conexión exitosa

echo.
echo 🗃️  Creando base de datos '%DB_NAME%'...

REM Crear base de datos si no existe
echo CREATE DATABASE %DB_NAME%; | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres 2>nul
if errorlevel 1 (
    echo ⚠️  Base de datos ya existe o error creándola (continuando...)
) else (
    echo ✅ Base de datos '%DB_NAME%' creada
)

echo.
echo 📝 Actualizando archivo .env...

REM Construir DATABASE_URL
set DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%

REM Actualizar .env files
if exist "backend-python\.env" (
    REM Crear backup
    copy "backend-python\.env" "backend-python\.env.backup" >nul
    
    REM Actualizar DATABASE_URL
    powershell -Command "(Get-Content 'backend-python\.env') -replace '^DATABASE_URL=.*', 'DATABASE_URL=%DATABASE_URL%' | Set-Content 'backend-python\.env'"
    echo ✅ backend-python\.env actualizado
) else (
    echo DATABASE_URL=%DATABASE_URL% > backend-python\.env
    echo SECRET_KEY=tu_clave_super_secreta_de_minimo_32_caracteres_aqui >> backend-python\.env
    echo ✅ backend-python\.env creado
)

echo.
echo 🔄 Ejecutando migraciones...

cd backend-python
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate && python -c "from app.core.database import create_tables; create_tables()"
    if errorlevel 1 (
        echo ⚠️  Error ejecutando migraciones (la base de datos funciona, pero las tablas se crearán automáticamente)
    ) else (
        echo ✅ Migraciones ejecutadas exitosamente
    )
) else (
    echo ⚠️  Entorno virtual no encontrado. Ejecuta: install-everything.cmd primero
)
cd ..

echo.
echo 🎉 CONFIGURACION DE BASE DE DATOS COMPLETADA!
echo.
echo 📋 RESUMEN:
echo    ✅ Base de datos: %DB_NAME%
echo    ✅ Host: %DB_HOST%:%DB_PORT%
echo    ✅ Usuario: %DB_USER%
echo    ✅ Connection String configurado en backend-python\.env
echo.
echo 🔗 CONNECTION STRING:
echo    %DATABASE_URL%
echo.
echo 💡 SIGUIENTE PASO:
echo    1. Ejecuta: validate-config.cmd para verificar
echo    2. Ejecuta: start-dev.cmd para iniciar la aplicación
echo.
pause
