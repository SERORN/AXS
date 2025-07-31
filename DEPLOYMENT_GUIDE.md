# 🚀 AXS360 Deployment Scripts

## Railway Deployment

### 1. Prepare Railway Configuration

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 2. Environment Variables for Railway

Set these in Railway dashboard:

**Backend Service:**
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/axs-prod
JWT_SECRET=your-super-secret-jwt-key-production
FRONTEND_URL=https://your-frontend-domain.railway.app

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME="AXS360 Platform"
```

**Frontend Service:**
```bash
VITE_API_URL=https://your-backend-service.railway.app/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
VITE_APP_NAME=AXS360
```

### 3. Deployment Steps

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway new

# 4. Link to existing project (optional)
railway link [project-id]

# 5. Deploy backend
cd backend
railway up

# 6. Deploy frontend
cd ..
railway up
```

## Render Deployment

### 1. Backend Service Configuration

**Build Command:**
```bash
cd backend && npm install && npm run build
```

**Start Command:**
```bash
cd backend && npm start
```

### 2. Frontend Service Configuration

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```bash
dist
```

## Vercel Deployment (Frontend Only)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
# Build frontend
npm run build:frontend

# Deploy to Vercel
vercel --prod
```

### 3. Vercel Configuration (vercel.json)
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@axs-api-url",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@stripe-publishable-key"
  }
}
```

## Netlify Deployment (Frontend Only)

### 1. Build Configuration (_redirects)
```bash
/*    /index.html   200
```

### 2. Environment Variables
```bash
VITE_API_URL=https://your-backend-api.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

## Docker Deployment

### 1. Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### 2. Frontend Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## AWS Deployment

### 1. Elastic Beanstalk (Backend)
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

### 2. S3 + CloudFront (Frontend)
```bash
# Build frontend
npm run build:frontend

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Post-Deployment Checklist

### 1. Verify Services
- [ ] Backend API responds to health check
- [ ] Frontend loads correctly
- [ ] Authentication flow works
- [ ] Payment processing works
- [ ] Email notifications work

### 2. Configure Webhooks
- [ ] Update Stripe webhook URL to production
- [ ] Test webhook delivery
- [ ] Verify webhook signature validation

### 3. DNS & SSL
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Update CORS settings
- [ ] Configure environment-specific URLs

### 4. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up log aggregation
- [ ] Configure uptime monitoring

### 5. Security
- [ ] Review environment variables
- [ ] Test rate limiting
- [ ] Verify HTTPS redirects
- [ ] Test role-based access

## Monitoring & Maintenance

### 1. Health Checks
```bash
# Backend health
curl https://your-api.com/api/health

# Test authentication
curl -X POST https://your-api.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15005550006"}'
```

### 2. Database Backup
```bash
# MongoDB Atlas automatic backups
# Or manual backup:
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)
```

### 3. Log Analysis
```bash
# Check application logs
railway logs

# Check for errors
railway logs | grep ERROR
```

## Troubleshooting

### Common Issues

**CORS Errors**
- Check `FRONTEND_URL` in backend environment
- Verify origin in CORS middleware

**Webhook Failures**
- Check webhook URL is publicly accessible
- Verify webhook secret matches Stripe dashboard
- Check Content-Type header

**Database Connection**
- Verify MongoDB URI format
- Check IP whitelist in MongoDB Atlas
- Verify credentials

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check environment variables are set

### Emergency Rollback
```bash
# Railway
railway rollback

# Vercel
vercel --rollback

# Manual rollback
git revert HEAD~1
git push origin main
```

---

**Deployment completed! 🎉**

Your AXS360 platform is now live and ready for production use!
