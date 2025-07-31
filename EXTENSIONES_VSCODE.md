# 🔧 EXTENSIONES DE VS CODE RECOMENDADAS

## 📋 **EXTENSIONES ESENCIALES (Instala estas)**

### **Para React/TypeScript:**
- `ES7+ React/Redux/React-Native snippets` - Snippets útiles
- `Auto Rename Tag` - Renombra tags automáticamente
- `Bracket Pair Colorizer` - Colorea brackets
- `TypeScript Importer` - Auto-importa TypeScript

### **Para Python:**
- `Python` (Microsoft) - Soporte completo de Python
- `Pylance` - IntelliSense avanzado
- `Python Docstring Generator` - Genera docstrings

### **Para Development:**
- `Thunder Client` - Cliente REST (alternativa a Postman)
- `GitLens` - Git avanzado
- `Error Lens` - Muestra errores en línea
- `Prettier` - Formateador de código
- `ESLint` - Linter JavaScript/TypeScript

### **Para Database:**
- `SQLTools` - Cliente SQL universal
- `PostgreSQL` - Soporte PostgreSQL específico

### **Para Mobile (React Native):**
- `React Native Tools` - Debug React Native
- `React Native Snippet` - Snippets React Native

---

## 🚀 **INSTALAR EXTENSIONES AUTOMATICAMENTE**

Ejecuta este comando en la terminal de VS Code:

```bash
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension formulahendry.auto-rename-tag  
code --install-extension coenraads.bracket-pair-colorizer
code --install-extension pmneo.tsimporter
code --install-extension ms-python.python
code --install-extension ms-python.pylance
code --install-extension njpwerner.autodocstring
code --install-extension rangav.vscode-thunder-client
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension mtxr.sqltools
code --install-extension ms-ossdata.vscode-postgresql
code --install-extension msjsdiag.vscode-react-native
code --install-extension jundat95.react-native-snippet
```

---

## ⚙️ **CONFIGURACIÓN RECOMENDADA**

Agrega esto a tu `settings.json` de VS Code:

```json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "python.defaultInterpreterPath": "./backend-python/venv/Scripts/python.exe",
    "python.terminal.activateEnvironment": true,
    "typescript.preferences.importModuleSpecifier": "relative",
    "emmet.includeLanguages": {
        "typescript": "html",
        "typescriptreact": "html"
    },
    "[python]": {
        "editor.defaultFormatter": "ms-python.black-formatter"
    }
}
```

---

## 📁 **CONFIGURACIÓN DE WORKSPACE**

El archivo `.vscode/settings.json` ya está configurado automáticamente con:

- ✅ Python interpreter correcto
- ✅ Prettier como formateador
- ✅ ESLint habilitado
- ✅ Auto-save configurado
- ✅ Emmet para TypeScript
- ✅ Configuración multi-root workspace

---

## 🎯 **EXTENSIONES OPCIONALES (Pero útiles)**

### **Productividad:**
- `Live Server` - Servidor local rápido
- `TODO Highlight` - Resalta TODOs
- `Bookmarks` - Marcadores en código
- `Path Intellisense` - Autocompletado de rutas

### **UI/UX:**
- `Material Icon Theme` - Iconos bonitos
- `One Dark Pro` - Tema oscuro popular
- `Indent Rainbow` - Colorea indentación

### **Database Avanzado:**
- `Database Client` - Cliente DB visual
- `Redis Client` - Para Redis (si lo usas)

---

## 📝 **CONFIGURACIÓN DE PRETTIER**

El archivo `.prettierrc` ya está configurado:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 🔧 **SHORTCUTS ÚTILES**

### **Desarrollo:**
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+`` - Terminal
- `Ctrl+Shift+E` - Explorer
- `F5` - Debug
- `Ctrl+Shift+F` - Buscar en archivos

### **Código:**
- `Alt+Shift+F` - Formatear documento
- `Ctrl+D` - Seleccionar siguiente coincidencia
- `Alt+Click` - Multi-cursor
- `Ctrl+/` - Comentar línea
- `Shift+Alt+Down` - Duplicar línea

---

## 🚀 **YA CONFIGURADO EN EL PROYECTO**

✅ **Workspace multi-root** - Maneja todos los componentes  
✅ **TypeScript strict** - Configuración estricta  
✅ **ESLint rules** - Reglas de código  
✅ **Prettier config** - Formato consistente  
✅ **Python environment** - Detecta venv automáticamente  
✅ **Debug configs** - Para todos los componentes  

**¡Tu VS Code está listo para desarrollar AXS360!** 🎉
