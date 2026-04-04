# Production deployment script for VSBH-CL

#!/bin/bash

set -e

echo "🚀 Starting VSBH-CL deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs nginx/ssl

# Generate self-signed SSL certificate for development (replace with real certificates in production)
if [ ! -f nginx/ssl/cert.pem ]; then
    echo "🔐 Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=IN/ST=State/L=City/O=VSBH/OU=IT/CN=localhost"
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/vsbh_cl
REDIS_URL=redis://redis:6379

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Authentication
ADMIN_KEY=your_secure_admin_key_here
JWT_SECRET=your_jwt_secret_here

# Application
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Google Sheets (optional)
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SHEETS_NAME=Form Responses 1
EOF
    echo "⚠️  Please update .env file with your actual configuration values"
fi

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is available at: https://localhost"
    echo "📊 Health check: https://localhost/health"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi

echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Update application: git pull && docker-compose build && docker-compose up -d"
