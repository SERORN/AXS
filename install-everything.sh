#!/bin/bash
# AXS360 - INSTALACIÓN AUTOMÁTICA COMPLETA
# Este script instala TODA la plataforma automáticamente

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "   AXS360 - INSTALACIÓN AUTOMÁTICA COMPLETA"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${PURPLE}[PASO $1/8]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header

# Step 1: Check prerequisites
print_step 1 "Verificando prerrequisitos..."

if ! command_exists node; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm no está instalado"
    exit 1
fi

if ! command_exists python3 && ! command_exists python; then
    print_error "Python no está instalado. Por favor instala Python 3.8+ desde https://python.org"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js encontrado: $NODE_VERSION"

# Step 2: Install global dependencies
print_step 2 "Instalando dependencias globales..."

if ! command_exists react-native; then
    print_info "Instalando React Native CLI..."
    npm install -g react-native-cli
fi

print_success "Dependencias globales instaladas"

# Step 3: Install main frontend dependencies
print_step 3 "Instalando dependencias del frontend principal..."
npm install
print_success "Frontend principal configurado"

# Step 4: Install backend dependencies
print_step 4 "Configurando backend Python..."
cd backend-python

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creando entorno virtual de Python..."
    python3 -m venv venv 2>/dev/null || python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

print_info "Instalando dependencias de Python..."
pip install -r requirements.txt

cd ..
print_success "Backend Python configurado"

# Step 5: Install landing page dependencies
print_step 5 "Configurando landing page..."
cd landing-page
npm install
cd ..
print_success "Landing page configurada"

# Step 6: Install business dashboard dependencies
print_step 6 "Configurando business dashboard..."
cd business-dashboard
npm install
cd ..
print_success "Business dashboard configurado"

# Step 7: Install mobile app dependencies
print_step 7 "Configurando mobile app..."
cd mobile-app
npm install
cd ..
print_success "Mobile app configurado"

# Step 8: Create startup scripts
print_step 8 "Creando scripts de inicio..."

# Create start development script
cat > start-dev.cmd << 'EOF'
@echo off
echo 🚀 Iniciando AXS360 - Entorno de Desarrollo...

echo.
echo Iniciando Backend Python...
start cmd /k "cd backend-python && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 > nul

echo Iniciando Frontend Principal...
start cmd /k "npm run dev"

timeout /t 2 > nul

echo Iniciando Landing Page...
start cmd /k "cd landing-page && npm run dev"

timeout /t 2 > nul

echo Iniciando Business Dashboard...
start cmd /k "cd business-dashboard && npm run dev"

echo.
echo ✅ Todos los servicios iniciados!
echo.
echo 🌐 URLs disponibles:
echo • Frontend Principal: http://localhost:5173
echo • Backend API: http://localhost:8000
echo • Landing Page: http://localhost:3000
echo • Business Dashboard: http://localhost:3001
echo • Documentación API: http://localhost:8000/docs
echo.
echo Presiona cualquier tecla para salir...
pause > nul
EOF

# Create Unix start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando AXS360 - Entorno de Desarrollo..."

# Function to kill all background processes on exit
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID $LANDING_PID $DASHBOARD_PID 2>/dev/null
    exit
}

trap cleanup INT

echo "🐍 Iniciando Backend Python..."
cd backend-python
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "⚛️  Iniciando Frontend Principal..."
npm run dev &
FRONTEND_PID=$!

sleep 2

echo "🌐 Iniciando Landing Page..."
cd landing-page && npm run dev &
LANDING_PID=$!
cd ..

sleep 2

echo "🏢 Iniciando Business Dashboard..."
cd business-dashboard && npm run dev &
DASHBOARD_PID=$!
cd ..

echo ""
echo "✅ Todos los servicios iniciados!"
echo ""
echo "🌐 URLs disponibles:"
echo "• Frontend Principal: http://localhost:5173"
echo "• Backend API: http://localhost:8000"
echo "• Landing Page: http://localhost:3000"
echo "• Business Dashboard: http://localhost:3001"
echo "• Documentación API: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

wait
EOF

chmod +x start-dev.sh

# Create build script
cat > build-production.cmd << 'EOF'
@echo off
echo 🏗️ Construyendo AXS360 para Producción...

echo Construyendo Frontend Principal...
call npm run build

echo Construyendo Landing Page...
cd landing-page
call npm run build
cd ..

echo Construyendo Business Dashboard...
cd business-dashboard
call npm run build
cd ..

echo Construyendo Mobile App (Android)...
cd mobile-app
call npm run build:android:release
cd ..

echo ✅ Construcción completada!
pause
EOF

# Create configuration validation script
cat > validate-config.cmd << 'EOF'
@echo off
echo 🔍 Validando Configuración de AXS360...

echo.
echo Verificando archivos .env...

if not exist ".env" (
    echo ❌ .env del frontend no encontrado
) else (
    echo ✅ .env del frontend encontrado
)

if not exist "backend-python\.env" (
    echo ❌ .env del backend no encontrado
) else (
    echo ✅ .env del backend encontrado
)

if not exist "landing-page\.env.local" (
    echo ❌ .env de landing page no encontrado
) else (
    echo ✅ .env de landing page encontrado
)

if not exist "business-dashboard\.env.local" (
    echo ❌ .env de business dashboard no encontrado
) else (
    echo ✅ .env de business dashboard encontrado
)

echo.
echo 📋 Para completar la configuración, edita estos archivos con tus credenciales:
echo • .env (Frontend)
echo • backend-python\.env (Backend)
echo • landing-page\.env.local (Landing Page)
echo • business-dashboard\.env.local (Business Dashboard)
echo.
pause
EOF

print_success "Scripts de inicio creados"

# Final summary
echo ""
echo -e "${GREEN}🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉${NC}"
echo ""
echo -e "${BLUE}📋 RESUMEN DE INSTALACIÓN:${NC}"
echo "✅ Frontend Principal"
echo "✅ Backend Python con FastAPI"
echo "✅ Landing Page con Next.js"
echo "✅ Business Dashboard"
echo "✅ Mobile App con React Native"
echo "✅ Scripts de automatización"
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASOS:${NC}"
echo "1. Configura tus credenciales en los archivos .env"
echo "2. Ejecuta 'validate-config.cmd' para verificar configuración"
echo "3. Ejecuta 'start-dev.cmd' para iniciar el entorno de desarrollo"
echo ""
echo -e "${BLUE}🌐 URLs que estarán disponibles:${NC}"
echo "• Frontend Principal: http://localhost:5173"
echo "• Backend API: http://localhost:8000"
echo "• Landing Page: http://localhost:3000"
echo "• Business Dashboard: http://localhost:3001"
echo "• Documentación API: http://localhost:8000/docs"
echo ""
echo -e "${PURPLE}🚀 Para iniciar todo ejecuta: start-dev.cmd${NC}"
echo ""
