# 🚀 AXS360 - Advanced Keyless Access Platform

## 🌟 Overview

AXS360 is a comprehensive keyless access platform featuring:

- **Real SMS Authentication** via Twilio
- **Stripe Payment Processing** with wallet system
- **Membership Plans** with subscriptions
- **Admin Dashboard** with analytics
- **Digital Wallet** for seamless payments
- **Email Notifications** for key events

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router DOM
- **Payments**: Stripe React Elements
- **Notifications**: React Toastify
- **State Management**: React Context API

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Twilio Verify
- **Payments**: Stripe PaymentIntents + Webhooks
- **Email**: Nodemailer SMTP

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB
- Twilio account (for SMS OTP)
- Stripe account (for payments)
- SMTP email service (Gmail/SendGrid)

### 1. Installation

```bash
# Install all dependencies
npm run setup

# Or manually:
npm install
npm run install:backend
```

### 2. Environment Configuration

#### Frontend (.env)
```bash
# Copy example and configure
cp .env.example .env

# Required variables:
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

#### Backend (backend/.env)
```bash
# Copy example and configure
cp backend/.env.example backend/.env

# Configure all required variables (see .env.example for details)
```

### 3. Development

```bash
# Start both frontend and backend
npm run dev:full

# Or separately:
npm run dev:backend    # Backend on :3001
npm run dev:frontend   # Frontend on :5173
```

## 🔧 Service Configuration

### Twilio Setup (SMS OTP)
1. Create account at [Twilio Console](https://console.twilio.com/)
2. Navigate to **Develop > Verify > Services**
3. Create new Verify service
4. Copy credentials to backend/.env

### Stripe Setup (Payments)
1. Create account at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from **Developers > API keys**
3. Set up webhook endpoint: `https://your-domain.com/api/payments/webhook`

## 📱 Features

### User Features
- **Authentication**: Phone + SMS OTP
- **Wallet Management**: Balance, top-up, transaction history
- **Plan Subscriptions**: Browse and subscribe to plans
- **Profile Management**: View active plans and account info

### Admin Features (role: 'admin')
- **Dashboard Analytics**: Users, revenue, plans statistics
- **User Management**: View users, update roles
- **Plan Management**: Create, edit, delete plans

## 🏭 Production Deployment

### Build Commands

```bash
# Full build (frontend + backend)
npm run build:full

# Frontend only
npm run build:frontend

# Backend only  
npm run build:backend
```

## 🧪 Testing

### Test Cards (Stripe)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

### Test Phone Numbers (Twilio)
- **Valid**: +15005550006 (receives SMS)
- **Invalid**: +15005550001 (invalid number)

## 📞 Support

For detailed setup instructions, see:
- `FRONTEND_INTEGRATION.md` - Frontend integration guide
- `IMPLEMENTATION_CHECKLIST.md` - Complete setup checklist
- `QUICK_START.md` - Quick configuration guide

---

**Built with ❤️ for seamless access control**
