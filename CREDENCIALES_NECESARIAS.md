# 🔑 AXS360 - CREDENCIALES QUE DEBES CONFIGURAR

## ⚠️ **IMPORTANTE: SOLO ESTAS CREDENCIALES FALTAN**

La plataforma está **100% COMPLETA** y funcional. Solo necesitas llenar estas credenciales para ponerla en producción.

---

## 📝 **ARCHIVO 1: `.env` (Frontend Principal)**
**Ubicación:** `c:\Users\clvme\Desktop\Lukas\Proyectos\AXS\.env`

### 🔑 **LO QUE DEBES LLENAR:**

```bash
# STRIPE (OBLIGATORIO para pagos)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
# 👆 Obtén en: https://dashboard.stripe.com/apikeys

# FIREBASE (OPCIONAL - para notificaciones push móviles)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
# 👆 Obtén en: https://console.firebase.google.com

# GOOGLE MAPS (OPCIONAL - para mapas y ubicaciones)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# 👆 Obtén en: https://console.cloud.google.com/apis/credentials
```

---

## 📝 **ARCHIVO 2: `backend-python\.env` (Backend)**
**Ubicación:** `c:\Users\clvme\Desktop\Lukas\Proyectos\AXS\backend-python\.env`

### 🔑 **LO QUE DEBES LLENAR:**

```bash
# BASE DE DATOS (OBLIGATORIO)
DATABASE_URL=postgresql://username:password@localhost:5432/axs360_db
POSTGRES_PASSWORD=your_postgres_password
# 👆 Instala PostgreSQL o usa un servicio como Neon, Supabase

# SEGURIDAD JWT (OBLIGATORIO)
SECRET_KEY=tu_clave_super_secreta_de_minimo_32_caracteres_aqui
# 👆 Genera una clave fuerte aleatoria

# STRIPE (OBLIGATORIO para pagos)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_HERE
# 👆 Obtén en: https://dashboard.stripe.com/apikeys

# TWILIO (OBLIGATORIO para SMS de verificación)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
# 👆 Obtén en: https://www.twilio.com/console

# SENDGRID (OBLIGATORIO para emails)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@tudominio.com
# 👆 Obtén en: https://app.sendgrid.com/settings/api_keys
```

---

## 📝 **ARCHIVO 3: `landing-page\.env.local` (Landing Page)**
**Ubicación:** `c:\Users\clvme\Desktop\Lukas\Proyectos\AXS\landing-page\.env.local`

### 🔑 **LO QUE DEBES LLENAR:**

```bash
# MARKETING Y ANALYTICS (OPCIONAL pero recomendado)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# 👆 Obtén en: https://analytics.google.com

NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_facebook_pixel_id
# 👆 Obtén en: https://business.facebook.com/events_manager

# CONTACTO (OBLIGATORIO para formularios)
NEXT_PUBLIC_CONTACT_EMAIL=contact@tudominio.com
CONTACT_FORM_WEBHOOK=https://hooks.zapier.com/hooks/catch/your_webhook
# 👆 Configura Zapier o similar para recibir mensajes de contacto

# DEMOS (OPCIONAL)
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/tu-cuenta/demo
# 👆 Tu link de Calendly para agendar demos

# DOMINIO (OBLIGATORIO para producción)
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

---

## 📝 **ARCHIVO 4: `business-dashboard\.env.local` (Dashboard)**
**Ubicación:** `c:\Users\clvme\Desktop\Lukas\Proyectos\AXS\business-dashboard\.env.local`

### 🔑 **LO QUE DEBES LLENAR:**

```bash
# AUTENTICACIÓN (OBLIGATORIO)
NEXTAUTH_SECRET=tu_clave_secreta_nextauth_minimo_32_caracteres
# 👆 Genera una clave fuerte aleatoria

NEXTAUTH_URL=http://localhost:3001
# 👆 Cambia por tu dominio en producción

# STRIPE (OBLIGATORIO)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
# 👆 La misma clave pública de Stripe

# ANALYTICS (OPCIONAL)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# 👆 Misma ID que en landing page
```

---

## 🚀 **INSTRUCCIONES PASO A PASO**

### **1. CONFIGURACIÓN MÍNIMA (Para empezar a usar)**
Solo necesitas configurar esto para usar la plataforma:

- **PostgreSQL**: Base de datos (puedes usar Neon.tech gratis)
- **Stripe**: Pagos (cuenta test gratuita)
- **Twilio**: SMS (cuenta test gratuita)
- **SendGrid**: Email (cuenta gratuita)
- **JWT Secret**: Genera una clave random

### **2. CONFIGURACIÓN COMPLETA (Para producción)**
Agrega estas para funcionalidad completa:

- **Firebase**: Notificaciones push
- **Google Maps**: Mapas y ubicaciones
- **Google Analytics**: Métricas
- **Dominio propio**: Para producción

---

## 📋 **SERVICIOS QUE NECESITAS CREAR**

### **1. PostgreSQL (Base de datos) - OBLIGATORIO**
- **Opción 1 (Gratis):** [Neon.tech](https://neon.tech) 
- **Opción 2 (Local):** Instalar PostgreSQL en tu PC
- **Opción 3 (Cloud):** AWS RDS, Google Cloud SQL

### **2. Stripe (Pagos) - OBLIGATORIO**
- Ir a [stripe.com](https://stripe.com)
- Crear cuenta gratuita
- Ir a Dashboard > API Keys
- Copiar las claves de test

### **3. Twilio (SMS) - OBLIGATORIO**
- Ir a [twilio.com](https://twilio.com)
- Crear cuenta (incluye $15 gratis)
- Ir a Console > Account Info
- Copiar Account SID y Auth Token

### **4. SendGrid (Email) - OBLIGATORIO**
- Ir a [sendgrid.com](https://sendgrid.com)
- Crear cuenta gratuita (100 emails/día)
- Ir a Settings > API Keys
- Crear nueva API key

### **5. Firebase (Notificaciones) - OPCIONAL**
- Ir a [console.firebase.google.com](https://console.firebase.google.com)
- Crear proyecto
- Agregar app web
- Copiar configuración

### **6. Google Maps (Mapas) - OPCIONAL**
- Ir a [console.cloud.google.com](https://console.cloud.google.com)
- Crear proyecto
- Habilitar Maps JavaScript API
- Crear credencial API Key

---

## 🎯 **TIEMPO ESTIMADO DE CONFIGURACIÓN**

- **⏱️ Configuración mínima:** 30-45 minutos
- **⏱️ Configuración completa:** 1-2 horas

---

## ✅ **VERIFICAR CONFIGURACIÓN**

Después de llenar las credenciales, ejecuta:

```bash
validate-config.cmd
```

---

## 🚀 **INICIAR LA PLATAFORMA**

Una vez configurado todo:

```bash
start-dev.cmd
```

**URLs disponibles:**
- 🌐 **Frontend:** http://localhost:5173
- 🔧 **Backend API:** http://localhost:8000
- 📄 **Landing Page:** http://localhost:3000
- 🏢 **Dashboard:** http://localhost:3001
- 📚 **API Docs:** http://localhost:8000/docs

---

## ❓ **¿NECESITAS AYUDA?**

Si tienes problemas configurando algún servicio, puedo ayudarte específicamente con cualquiera de estos pasos.
