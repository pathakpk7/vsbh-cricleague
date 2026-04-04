# VSBH-CL GitHub Deployment Guide

## 🚀 Deploy via GitHub Repository

This guide will help you deploy VSBH-CL automatically through GitHub Actions CI/CD.

---

## 📋 Prerequisites

### 1. **GitHub Repository**
- ✅ Repository already exists: `https://github.com/pathakpk7/vsbh-cricleague`
- ✅ Code is ready for deployment

### 2. **Server Requirements**
- Ubuntu 20.04+ server with:
  - Docker & Docker Compose installed
  - SSH access configured
  - Domain name pointing to server
  - SSL certificates (Let's Encrypt recommended)

### 3. **GitHub Secrets**
You need to add these secrets to your GitHub repository:

#### Required Secrets:
```
DEPLOY_HOST=your_server_ip_or_domain
DEPLOY_USER=your_ssh_username
DEPLOY_SSH_KEY=your_private_ssh_key
```

#### Optional Secrets:
```
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

---

## ⚙️ Setup Instructions

### Step 1: Prepare Your Server

```bash
# 1. SSH into your server
ssh your_user@your_server

# 2. Create deployment directory
sudo mkdir -p /opt/vsbh-cl
sudo chown $USER:$USER /opt/vsbh-cl
cd /opt/vsbh-cl

# 3. Clone repository (initial setup)
git clone https://github.com/pathakpk7/vsbh-cricleague.git .

# 4. Create environment file
cp server/.env.example server/.env
# Edit with your actual values

# 5. Create docker-compose.prod.yml
cp docker-compose.yml docker-compose.prod.yml
# Update with production settings
```

### Step 2: Generate SSH Key for GitHub Actions

```bash
# On your server (or local machine):
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Copy private key (this goes to GitHub secrets)
cat ~/.ssh/github-actions
```

### Step 3: Add Secrets to GitHub

1. Go to your repository: `https://github.com/pathakpk7/vsbh-cricleague`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

| Secret Name | Value |
|--------------|-------|
| `DEPLOY_HOST` | Your server IP or domain |
| `DEPLOY_USER` | Your SSH username |
| `DEPLOY_SSH_KEY` | The private SSH key content |

### Step 4: Configure Production Environment

```bash
# On your server, edit docker-compose.yml:
nano docker-compose.yml
```

Update with production settings:
```yaml
services:
  backend:
    image: ghcr.io/pathakpk7/vsbh-cricleague:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
      ADMIN_KEY: ${ADMIN_KEY}
      JWT_SECRET: ${JWT_SECRET}
```

### Step 5: Push to GitHub

```bash
# Add all files and push
git add .
git commit -m "Add GitHub Actions deployment configuration"
git push origin main
```

---

## 🔄 Deployment Process

### Automatic Deployment

When you push to `main` branch:

1. **GitHub Actions** triggers automatically
2. **Tests** run to ensure code quality
3. **Docker image** builds and pushes to GitHub Container Registry
4. **Deployment** to your production server
5. **Health check** verifies successful deployment

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **"Deploy VSBH-CL"** workflow
3. Click **"Run workflow"**

---

## 🌐 Deployment Options

### Option 1: Self-Hosted Server (Recommended)

**Pros:**
- Full control over environment
- Cost-effective
- Custom domain and SSL

**Setup:**
- Use the provided GitHub Actions workflow
- Server runs Docker containers
- Nginx reverse proxy with SSL

### Option 2: Cloud Platform Services

#### Vercel (Frontend) + Railway/Render (Backend)

```yaml
# .github/workflows/vercel-deploy.yml
name: Deploy to Vercel + Railway

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./client

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          service-id: ${{ secrets.RAILWAY_SERVICE_ID }}
```

#### AWS (ECS + RDS)

```yaml
# .github/workflows/aws-deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster vsbh-cl --service vsbh-cl-service
```

---

## 🔧 Environment Configuration

### Production Environment Variables

Create `.env.production` on your server:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vsbh_cl
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Authentication
ADMIN_KEY=your_secure_admin_key_here
JWT_SECRET=your_jwt_secret_here

# Application
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Domain
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com
```

### SSL Certificate Setup

```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Logs

### Health Checks

The deployment includes automated health checks:

```bash
# Manual health check
curl https://yourdomain.com/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Monitoring

```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# System monitoring
docker stats
```

---

## 🔄 Rollback Process

If deployment fails:

1. **Automatic Rollback**
   - GitHub Actions detects failed health check
   - Automatically rolls back to previous version
   - Notifies about deployment failure

2. **Manual Rollback**
```bash
# SSH into server
ssh user@yourdomain.com
cd /opt/vsbh-cl

# View previous versions
docker images | grep vsbh-cricleague

# Rollback to previous version
docker tag ghcr.io/pathakpk7/vsbh-cricleague:backup ghcr.io/pathakpk7/vsbh-cricleague:latest
docker-compose up -d
```

---

## 🎯 Deployment URLs

After successful deployment:

- **Main Application**: `https://yourdomain.com`
- **API Endpoints**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/health`
- **Admin Panel**: `https://yourdomain.com/admin`

---

## 🚨 Troubleshooting

### Common Issues

1. **SSH Key Authentication**
```bash
# Test SSH connection locally
ssh -i ~/.ssh/github-actions user@yourdomain.com

# Check authorized_keys
cat ~/.ssh/authorized_keys
```

2. **Docker Issues**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs backend

# Restart services
docker-compose restart
```

3. **Domain/SSL Issues**
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Test SSL certificate
openssl s_client -connect yourdomain.com:443
```

4. **GitHub Actions Failures**
- Check **Actions** tab in GitHub
- Review error logs
- Verify secrets are correctly configured
- Check server connectivity

---

## 📞 Support

### GitHub Issues
- Create an issue for deployment problems
- Include error logs and configuration details

### Direct Support
- Email: prasoon7pathak@gmail.com
- LinkedIn: [Prasoon Pathak](https://www.linkedin.com/in/prasoon7pathak07/)

---

## 🎉 Success!

Once deployed, your VSBH-CL application will be:

- ✅ **Live at your domain**
- ✅ **HTTPS enabled**
- ✅ **Auto-deploying on pushes**
- ✅ **Monitored and logged**
- ✅ **Ready for tournament use**

**🚀 Your VSBH Cricket League is now deployed and accessible worldwide!**
