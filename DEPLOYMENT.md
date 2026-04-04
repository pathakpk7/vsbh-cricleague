# VSBH-CL Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Docker & Docker Compose installed
- SSL certificates (for production)
- Environment variables configured

### Quick Start

1. **Clone and Setup**
```bash
git clone https://github.com/pathakpk7/vsbh-cricleague.git
cd vsbh-cricleague
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Deploy**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

1. **Build Docker Image**
```bash
docker build -t vsbh-cl .
```

2. **Start Services**
```bash
docker-compose up -d
```

3. **Check Health**
```bash
curl https://localhost/health
```

## 📋 Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `ADMIN_KEY` - Admin authentication key
- `JWT_SECRET` - JWT signing secret

### Optional
- `REDIS_URL` - Redis connection (defaults to redis://redis:6379)
- `GOOGLE_SHEETS_ID` - Google Sheets ID for player registration
- `LOG_LEVEL` - Logging level (info, warn, error)

## 🔧 Docker Services

### Backend
- **Image**: Custom build from Dockerfile
- **Port**: 5000
- **Health Check**: `/health` endpoint

### Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: Persistent data storage

### Redis
- **Image**: redis:7-alpine
- **Port**: 6379
- **Purpose**: Caching and sessions

### Nginx
- **Image**: nginx:alpine
- **Ports**: 80, 443
- **Purpose**: Reverse proxy and SSL termination

## 🔒 Security Features

- **SSL/TLS**: HTTPS only with SSL certificates
- **Rate Limiting**: API endpoints protected
- **Security Headers**: XSS, CSRF protection
- **Non-root User**: Container runs as non-root user
- **Health Checks**: Automated health monitoring

## 📊 Monitoring

### Health Endpoints
- **Application**: `/health`
- **Database**: Checked via application
- **Services**: Docker health checks

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f postgres
```

## 🔄 Updates

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
```

### Zero-downtime Deployment
```bash
# Scale up new version
docker-compose up -d --scale backend=2

# Scale down old version
docker-compose up -d --scale backend=1
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using port 80/443
sudo netstat -tulpn | grep :80
sudo lsof -i :80
```

2. **SSL Certificate Issues**
```bash
# Generate new certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

3. **Database Connection**
```bash
# Check database logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d vsbh_cl
```

4. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

## 📈 Performance Optimization

### Database
- Use connection pooling
- Add indexes for frequent queries
- Monitor slow queries

### Application
- Enable Redis caching
- Use CDN for static assets
- Optimize Socket.IO connections

### Infrastructure
- Use load balancer for scaling
- Enable Gzip compression
- Configure proper caching headers

## 🔧 Development vs Production

### Development
```bash
# Start development servers
npm run dev

# Uses: localhost:3000 (client) + localhost:5000 (server)
```

### Production
```bash
# Start production containers
docker-compose up -d

# Uses: localhost (nginx) -> backend -> database
```

## 🌐 Cloud Deployment

### AWS
- Use ECS/EKS for containers
- RDS for database
- ElastiCache for Redis
- ALB for load balancing

### Google Cloud
- Use GKE for containers
- Cloud SQL for database
- Memorystore for Redis
- Cloud Load Balancer

### Azure
- Use AKS for containers
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Application Gateway

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs`
- Verify environment variables
- Ensure all prerequisites are met
- Check resource availability (CPU, RAM, disk space)
