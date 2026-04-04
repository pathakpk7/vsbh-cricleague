# 🏏 VSBH Cricket League (VSBH-CL)

🚀 **PRODUCTION READY** - A full-stack real-time college cricket league management system featuring live auction, dynamic team creation, fixtures, stats, and leaderboard.

---

## 🎉 **LIVE DEPLOYMENT**

### 🌐 **Live Application URLs**
- **Frontend**: https://vsbh-cl.vercel.app ✅
- **Backend**: https://vsbh-cl-backend.onrender.com ✅  
- **Admin Panel**: https://vsbh-cl-backend.onrender.com/admin-test.html ✅
- **Health Check**: https://vsbh-cl-backend.onrender.com/health ✅

### 🔐 **Login Credentials**
- **Admin Key**: `unitedvsbh@321` (for admin panel access)
- **User Login**: Any email/name works (no restrictions)
- **Test Email**: `prasoon7pathak@gmail.com`
- **Captain Code**: Any unique code during team creation

### � **Mobile Features**
- ✅ **Responsive Design**: Optimized for mobile, tablet, and desktop
- ✅ **Hamburger Menu**: Mobile navigation in top-left corner
- ✅ **Modern UI**: Glassmorphism effects and smooth animations
- ✅ **Touch-Friendly**: Proper touch targets and gestures
- ✅ **WCAG Compliant**: Improved color contrast and accessibility

### �🚀 **Quick Start Guide**
1. **Visit**: https://vsbh-cl.vercel.app (mobile-friendly)
2. **Login** with any email/name as user
3. **Admin Access**: Go to https://vsbh-cl-backend.onrender.com/admin-test.html with key `unitedvsbh@321`
4. **Start Auction**: Use admin panel to begin live bidding
5. **Create Teams**: Captains can create teams with unique codes
6. **Enjoy**: Real-time cricket league management!

---

## 📌 Overview

VSBH-CL is a modern web application designed to simulate an IPL-style cricket league at the college level with real-time auction system, team management, and comprehensive tournament tracking.

### 🎯 Key Features

#### 🧑‍💼 Admin Features
- 🔥 **Live Auction Control** - Start/stop auction, manage bidding
- 👥 **Team Management** - Create teams, manage budgets, player assignments
- 📊 **System Administration** - Reset system, view logs, manage users
- 📡 **Real-time Monitoring** - Live auction updates via Socket.IO
- 🔐 **Admin Panel** - Secure admin dashboard with authentication

#### 👑 Captain Features  
- 🏆 **Dynamic Team Creation** - Create teams with unique captain codes
- 💰 **Budget Management** - Track team budget and player purchases
- 🎯 **Live Bidding** - Participate in real-time auction
- 📋 **Team Roster** - View and manage team players
- 🔑 **Secure Login** - Captain code authentication

#### 👤 Player Features
- 📝 **Easy Registration** - Simple login for all users
- 👀 **Live Viewing** - Watch live auction proceedings
- 📊 **Statistics** - View player stats and team performance
- 📅 **Fixtures** - View match schedules and results
- 🏆 **Leaderboard** - Track tournament standings

---

## ⚙️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Socket.IO Client** for real-time updates
- **CSS3** with modern styling (no frameworks)
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **Winston** for logging
- **Jest** for testing
- **Supabase** as database client

### Database
- **Supabase** (PostgreSQL)
- **Row Level Security** (RLS)
- **Real-time subscriptions**
- **Comprehensive schema** with relationships

### DevOps & Deployment
- **Docker** containerization
- **Docker Compose** orchestration
- **Nginx** reverse proxy
- **SSL/TLS** encryption
- **Health checks** and monitoring

---

## 🏗️ Project Structure

```
VSBH_CL/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic
│   ├── services/          # Background services
│   ├── utils/             # Helper functions
│   └── config/            # Configuration files
├── database/              # Database schemas
├── nginx/                 # Nginx configuration
├── logs/                  # Application logs
└── docker-compose.yml     # Container orchestration
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- **Docker** & **Docker Compose** (for deployment)
- **Supabase** account and project
- **Git** for version control

---

## ⚡ 1. Clone Repository

```bash
git clone https://github.com/pathakpk7/vsbh-cricleague.git
cd vsbh-cricleague
```

---

## ⚙️ 2. Environment Setup

### Server Environment
```bash
cd server
cp .env.example .env
```

**Edit `.env` file:**
```env
# Database
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication
ADMIN_KEY=your_secure_admin_key_here
JWT_SECRET=your_jwt_secret_here

# Application
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

# Google Sheets (optional)
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SHEETS_NAME=Form Responses 1
```

### Client Environment
```bash
cd client
cp .env.example .env
```

**Edit `.env` file:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🗄️ 3. Database Setup

### Using Supabase Dashboard

1. **Create new project** in Supabase
2. **Run SQL schema** from `database/schema.sql`
3. **Enable Row Level Security** (included in schema)
4. **Get connection strings** from Supabase settings

### Schema Overview
- **users** - Authentication and user management
- **teams** - Team information and budgets
- **players** - Player profiles and auction status
- **team_players** - Team-player relationships
- **matches** - Tournament matches and results
- **points_table** - Tournament standings
- **auction_state** - Live auction state
- **auction_logs** - Auction history

---

## 🌐 4. Development Setup

### Start Backend
```bash
cd server
npm install
npm run dev
```

### Start Frontend
```bash
cd client
npm install
npm start
```

### Concurrent Development
```bash
# From root directory
npm run dev
```

---

## 🐳 5. Docker Deployment

### Quick Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Docker Setup
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl https://localhost/health
```

---

## 🌍 Application URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Production (Docker)
- **Application**: https://localhost
- **API**: https://localhost/api
- **Health**: https://localhost/health

---

## 🔐 Authentication System

### User Roles
1. **Admin** - Full system access
2. **Captain** - Team management and bidding
3. **Player** - View-only access (any user can login)

### Login Methods
- **Admin**: Email + admin key
- **Captain**: Captain code validation
- **Player**: Any user credentials (no restrictions)

### Security Features
- JWT token-based authentication
- Rate limiting on login endpoints
- Admin key protection for sensitive operations
- Row-level security in database

---

## 🔥 Auction System

### Real-time Features
- **Live Bidding** - Real-time bid updates via Socket.IO
- **Timer Management** - Automatic countdown and player transitions
- **Budget Validation** - Prevent overspending
- **Team Constraints** - Enforce team composition rules

### Auction Flow
1. **Admin starts auction**
2. **Player displayed for bidding**
3. **Teams place bids in real-time**
4. **Timer counts down**
5. **Player sold or skipped**
6. **Next player automatically loaded**

### Admin Controls
- Start/stop auction
- Skip current player
- Reset entire system
- View auction history

---

## 📊 Features Implemented

### ✅ Core Features
- [x] **Live Auction System** with Socket.IO
- [x] **Dynamic Team Creation** with captain codes
- [x] **Multi-role Authentication** (Admin/Captain/Player)
- [x] **Real-time Updates** across all clients
- [x] **Budget Management** and validation
- [x] **Team Constraints** enforcement
- [x] **Player Registration** system
- [x] **Auction History** tracking
- [x] **Fixtures Management**
- [x] **Points Table** and standings
- [x] **Statistics Dashboard**
- [x] **Admin Reset API** with authentication
- [x] **Google Sheets Integration** (optional)

### ✅ Technical Features
- [x] **TypeScript** for type safety
- [x] **Error Handling** with custom error classes
- [x] **Logging** with Winston
- [x] **Testing** with Jest
- [x] **Docker** containerization
- [x] **Nginx** reverse proxy
- [x] **SSL/TLS** encryption
- [x] **Health Checks**
- [x] **Rate Limiting**
- [x] **Security Headers**

---

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend Tests
```bash
cd client
npm test                # Run all tests
npm run test:coverage   # Coverage report
```

### Test Coverage
- **API Endpoints** - Request/response validation
- **Authentication** - Login/logout flows
- **Auction Logic** - Bidding and validation
- **Components** - UI rendering and interactions

---

## 📋 API Documentation

### Authentication
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/reset` - System reset (admin only)

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get specific player

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get specific team

### Auction
- `GET /api/auction/state` - Get auction state
- `POST /api/auction/start` - Start auction
- `POST /api/auction/place-bid` - Place bid
- `POST /api/auction/sell` - Sell player
- `POST /api/auction/skip` - Skip player

### Socket.IO Events
- `join-auction` - Join auction room
- `bid-update` - Real-time bid updates
- `timer-update` - Timer countdown
- `player-sold` - Player sold notification

---

## 🔧 Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service key |
| `ADMIN_KEY` | ✅ | Admin authentication key |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `NODE_ENV` | ❌ | Environment (development/production) |
| `LOG_LEVEL` | ❌ | Logging level (info/warn/error) |

### Docker Configuration
- **Multi-stage build** for optimized production image
- **Non-root user** for security
- **Health checks** for all services
- **Volume mounts** for persistent data
- **Environment variables** for configuration

---

## 🚀 Deployment Options

### 1. Docker (Recommended)
```bash
./deploy.sh
```

### 2. Manual Deployment
```bash
# Build client
cd client && npm run build

# Start server
cd ../server && npm start
```

### 3. Cloud Platforms
- **AWS** - ECS/EKS + RDS + ElastiCache
- **Google Cloud** - GKE + Cloud SQL + Memorystore
- **Azure** - AKS + Azure Database + Azure Cache
- **DigitalOcean** - App Platform + Managed Database

---

## 📈 Performance & Scaling

### Optimization Features
- **Redis Caching** for frequent queries
- **Database Indexes** for performance
- **Gzip Compression** for responses
- **CDN Ready** static asset serving
- **Connection Pooling** for database

### Scaling Considerations
- **Horizontal Scaling** - Multiple backend instances
- **Load Balancing** - Nginx + multiple containers
- **Database Scaling** - Read replicas + connection pooling
- **Socket.IO Scaling** - Redis adapter for multi-instance

---

## � **Production Deployment**

### **Current Deployment Status: ✅ LIVE**

#### **Frontend (Vercel)**
- **URL**: https://vsbh-cl.vercel.app
- **Platform**: Vercel (Static React App)
- **CDN**: Global distribution
- **SSL**: Automatic HTTPS

#### **Backend (Render)**
- **URL**: https://vsbh-cl-backend.onrender.com
- **Platform**: Render (Node.js Service)
- **Database**: Supabase PostgreSQL
- **Real-time**: Socket.IO enabled

### **Deployment Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Vercel CDN    │    │    Render API    │    │  Supabase DB     │
│                 │    │                  │    │                  │
│ React Frontend  │◄──►│ Node.js Backend  │◄──►│ PostgreSQL       │
│ Global Edge     │    │ Socket.IO        │    │ Real-time        │
│ https://vsbh-cl │    │ https://vsbh-cl  │    │ qriibawpjsbazglb │
│ .vercel.app     │    │ -backend.onrender│    | wohn.supabase    │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

### **Environment Configuration**
- **Frontend**: Vercel Environment Variables
- **Backend**: Render Environment Variables
- **Database**: Supabase PostgreSQL
- **Authentication**: Custom JWT + Admin Key

---

## � Security Features

### Application Security
- **Input Validation** on all endpoints
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with content security policy
- **CSRF Protection** with same-site cookies
- **Rate Limiting** on sensitive endpoints

### Infrastructure Security
- **SSL/TLS Encryption** for all traffic
- **Non-root Containers** for isolation
- **Security Headers** (HSTS, XSS, CSRF)
- **Network Segmentation** with Docker networks
- **Secret Management** with environment variables

---

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
```bash
# Check what's using port 5000
netstat -tulpn | grep :5000
# Kill process
sudo kill -9 <PID>
```

2. **Database Connection**
```bash
# Check database logs
docker-compose logs postgres
# Test connection
psql $DATABASE_URL
```

3. **Socket.IO Issues**
```bash
# Check browser console for WebSocket errors
# Verify CORS settings in server
```

4. **Build Errors**
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Verbose Docker logs
docker-compose logs -f backend
```

---

## 📞 Support & Contact

### 🏆 **Project Status: COMPLETE ✅**

**VSBH-CL is now production-ready and live!**

- ✅ **Frontend**: Deployed on Vercel with global CDN
- ✅ **Backend**: Deployed on Render with real-time capabilities
- ✅ **Database**: Supabase PostgreSQL with RLS enabled
- ✅ **Authentication**: Multi-role system (Admin/Captain/Player)
- ✅ **Real-time**: Socket.IO for live auction updates
- ✅ **Security**: Production-grade security measures
- ✅ **Testing**: Comprehensive test coverage
- ✅ **Documentation**: Complete deployment guides

### 🎯 **Ready for Tournament Use**

The system is fully functional and ready for:
- **Live Auction Events** with real-time bidding
- **Team Management** with budget tracking
- **Player Registration** and statistics
- **Match Fixtures** and results tracking
- **Leaderboard** and standings

### 📧 **Contact Information**
- **Developer**: Prasoon Pathak
- **Email**: prasoon7pathak@gmail.com
- **GitHub**: [pathakpk7/vsbh-cricleague](https://github.com/pathakpk7/vsbh-cricleague)
- **LinkedIn**: [Prasoon Pathak](https://www.linkedin.com/in/prasoon7pathak07/)

### 🐛 **Report Issues**
- **GitHub Issues**: [Create Issue](https://github.com/pathakpk7/vsbh-cricleague/issues)
- **Email Support**: prasoon7pathak@gmail.com

---

## 🎉 **Thank You!**

**Thank you for using VSBH Cricket League!**

This project represents a complete end-to-end solution for college cricket league management with modern web technologies, real-time capabilities, and production-ready deployment.

**🏏 Enjoy your cricket tournament! 🚀**

---

*Last Updated: April 2026 | Version: 1.0.0 | Status: Production Ready*

### Getting Help
- **Documentation** - Check this README first
- **Issues** - Open GitHub issue for bugs
- **Email** - prasoon7pathak@gmail.com
- **LinkedIn** - [Prasoon Pathak](https://www.linkedin.com/in/prasoon7pathak07/)

### Contributing
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests for new features
5. Submit pull request

---

## 🏁 Project Summary

VSBH-CL is a **production-ready** cricket league management system with:

- ✅ **Complete Feature Set** - Auction, teams, fixtures, stats
- ✅ **Real-time Architecture** - Socket.IO for live updates  
- ✅ **Modern Tech Stack** - React, Node.js, PostgreSQL
- ✅ **Production Deployment** - Docker, SSL, monitoring
- ✅ **Comprehensive Testing** - Unit and integration tests
- ✅ **Security First** - Authentication, validation, encryption
- ✅ **Scalable Design** - Microservices, caching, load balancing

---

## ⭐ Show Your Support

If you find this project useful, please give it a ⭐ on GitHub!

---

**🔥 Built with passion for cricket and code 🏏💻**