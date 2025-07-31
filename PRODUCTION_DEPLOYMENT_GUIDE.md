# AXS360 Production Deployment Guide

## 🚀 Complete Production Deployment

This guide covers deploying the complete AXS360 platform to production with all components.

### 📋 Prerequisites

- Docker & Docker Compose
- PostgreSQL production instance
- Redis production instance
- Domain name with SSL certificate
- Stripe account (production keys)
- Twilio account
- SendGrid account
- Cloud storage (AWS S3/Google Cloud Storage)

### 🔧 Environment Configuration

Create production environment files:

#### Backend Environment (`.env`)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/axs360_prod
REDIS_URL=redis://user:password@host:6379/0

# Security
SECRET_KEY=your-super-secure-256-bit-production-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe (PRODUCTION KEYS)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Twilio
TWILIO_ACCOUNT_SID=your_production_twilio_sid
TWILIO_AUTH_TOKEN=your_production_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid
SENDGRID_API_KEY=your_production_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# Production Settings
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=INFO
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://app.yourdomain.com"]
```

### 🐳 Docker Deployment

#### 1. Build and Deploy with Docker Compose
```bash
# Clone repository
git clone <your-repo-url>
cd AXS/backend-python

# Create production environment file
cp .env.example .env
# Edit .env with production values

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d

# Check services
docker-compose ps
docker-compose logs -f backend
```

#### 2. Database Setup
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python -c "
from app.core.database import get_sync_session
from app.crud.user import create_admin_user
db = next(get_sync_session())
create_admin_user(db, 'admin@yourdomain.com', 'secure_password')
"
```

### ☁️ Cloud Platform Deployment

#### AWS Deployment

##### 1. ECS (Elastic Container Service)
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t axs360-backend .
docker tag axs360-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/axs360-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/axs360-backend:latest

# Deploy with ECS CLI or CloudFormation
```

##### 2. RDS (PostgreSQL)
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier axs360-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username axs_user \
    --master-user-password your_secure_password \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxxx
```

##### 3. ElastiCache (Redis)
```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id axs360-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1
```

#### Google Cloud Platform

##### 1. Cloud Run
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/axs360-backend
gcloud run deploy axs360-backend \
    --image gcr.io/PROJECT_ID/axs360-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

##### 2. Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL instance
gcloud sql instances create axs360-db \
    --database-version=POSTGRES_13 \
    --tier=db-f1-micro \
    --region=us-central1
```

#### Azure Deployment

##### 1. Container Instances
```bash
# Deploy to Azure Container Instances
az container create \
    --resource-group axs360-rg \
    --name axs360-backend \
    --image your-registry/axs360-backend:latest \
    --dns-name-label axs360-api \
    --ports 8000
```

### 🌐 Frontend Deployment

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd ../  # Root directory
vercel --prod

# Configure environment variables in Vercel dashboard
# VITE_API_URL=https://api.yourdomain.com
```

#### Netlify
```bash
# Build frontend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### 📱 Mobile App Deployment

#### Android (Google Play Store)

##### 1. Build Release APK
```bash
cd mobile-app

# Generate signing key
keytool -genkey -v -keystore axs360-release-key.keystore -alias axs360 -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

##### 2. Upload to Google Play Console
1. Create Google Play Developer account
2. Create new application
3. Upload APK/AAB
4. Complete store listing
5. Submit for review

#### iOS (Apple App Store)

##### 1. Build Release IPA
```bash
# Open iOS project in Xcode
open ios/AXS360.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product -> Archive
# 3. Distribute App -> App Store Connect
```

##### 2. Upload to App Store Connect
1. Create Apple Developer account
2. Create new app in App Store Connect
3. Upload IPA through Xcode or Transporter
4. Complete app information
5. Submit for review

### 🔒 SSL/HTTPS Setup

#### Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare (Recommended)
1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full mode)
4. Configure firewall rules

### 📊 Monitoring and Analytics

#### Application Monitoring
```bash
# Sentry for error tracking
pip install sentry-sdk[fastapi]

# Add to main.py
import sentry_sdk
sentry_sdk.init(dsn="YOUR_SENTRY_DSN")
```

#### Infrastructure Monitoring
```bash
# Prometheus + Grafana
docker-compose -f monitoring/docker-compose.yml up -d

# Access Grafana: http://localhost:3000
```

### 🔄 CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push Docker image
        run: |
          docker build -t axs360-backend .
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push axs360-backend:latest
      
      - name: Deploy to production
        run: |
          # Deploy script
```

### 🗄️ Database Migration

#### From MongoDB to PostgreSQL
```python
# migration_script.py
import pymongo
import psycopg2
from app.models import User, Vehicle, Pass

# Connect to MongoDB
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["axs360"]

# Connect to PostgreSQL
pg_conn = psycopg2.connect("postgresql://user:pass@localhost/axs360_db")

# Migrate users
users = mongo_db.users.find()
for user in users:
    # Convert and insert to PostgreSQL
    # ... migration logic
```

### 🚀 Production Checklist

#### Security
- [ ] SSL certificate installed
- [ ] Production API keys configured
- [ ] Database connection secured
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Input validation active

#### Performance
- [ ] Database indexes created
- [ ] Redis caching enabled
- [ ] Image compression active
- [ ] CDN configured
- [ ] Load balancer setup

#### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Health checks configured
- [ ] Log aggregation setup
- [ ] Uptime monitoring

#### Mobile
- [ ] App store accounts created
- [ ] App icons and screenshots
- [ ] Store listings completed
- [ ] Push notification certificates
- [ ] In-app purchase configured

### 📞 Support and Maintenance

#### Backup Strategy
```bash
# Database backup
pg_dump -h localhost -U axs_user axs360_db > backup_$(date +%Y%m%d).sql

# Redis backup
redis-cli --rdb /backup/redis_backup.rdb

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

#### Update Procedure
```bash
# 1. Backup data
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Update dependencies
pip install -r requirements.txt

# 4. Run migrations
alembic upgrade head

# 5. Restart services
docker-compose restart backend

# 6. Verify deployment
curl https://api.yourdomain.com/health
```

### 🎯 Post-Deployment

1. **Test all endpoints**: Verify API functionality
2. **Mobile app testing**: Test on actual devices
3. **Performance testing**: Load testing with realistic traffic
4. **Security audit**: Penetration testing
5. **Documentation**: Update API documentation
6. **Team training**: Train support team
7. **Monitoring setup**: Configure alerts and dashboards

---

**Your AXS360 platform is now production-ready and deployed! 🚀**

For support and maintenance, refer to the operational runbooks and monitoring dashboards.
