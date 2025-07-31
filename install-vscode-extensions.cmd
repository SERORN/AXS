@echo off
echo 🔧 INSTALANDO EXTENSIONES DE VS CODE PARA AXS360...
echo.

echo 📦 Instalando extensiones esenciales...

echo ⚛️  React/TypeScript...
call code --install-extension dsznajder.es7-react-js-snippets
call code --install-extension formulahendry.auto-rename-tag
call code --install-extension coenraads.bracket-pair-colorizer
call code --install-extension pmneo.tsimporter

echo 🐍 Python...
call code --install-extension ms-python.python
call code --install-extension ms-python.pylance
call code --install-extension njpwerner.autodocstring

echo 🛠️  Development Tools...
call code --install-extension rangav.vscode-thunder-client
call code --install-extension eamodio.gitlens
call code --install-extension usernamehw.errorlens
call code --install-extension esbenp.prettier-vscode
call code --install-extension dbaeumer.vscode-eslint

echo 🗄️  Database...
call code --install-extension mtxr.sqltools
call code --install-extension ms-ossdata.vscode-postgresql

echo 📱 React Native...
call code --install-extension msjsdiag.vscode-react-native
call code --install-extension jundat95.react-native-snippet

echo.
echo 🎨 Instalando extensiones de productividad (opcionales)...

call code --install-extension pkief.material-icon-theme
call code --install-extension zhuangtongfa.material-theme
call code --install-extension oderwat.indent-rainbow
call code --install-extension aaron-bond.better-comments

echo.
echo ✅ INSTALACION COMPLETADA!
echo.
echo 📋 Extensiones instaladas:
echo    ✅ React/TypeScript snippets y herramientas
echo    ✅ Python con Pylance
echo    ✅ ESLint y Prettier
echo    ✅ Thunder Client (REST API testing)
echo    ✅ GitLens (Git avanzado)
echo    ✅ Database tools (PostgreSQL)
echo    ✅ React Native tools
echo    ✅ Material Icons y tema
echo.
echo 🔄 REINICIA VS CODE para aplicar cambios
echo.
echo 💡 Tip: Abre el proyecto con: code .
pause
