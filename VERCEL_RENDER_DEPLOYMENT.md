# VSBH-CL Vercel + Render Deployment Guide

## 🚀 Combined Deployment: Vercel (Frontend) + Render (Backend)

This guide will help you deploy VSBH-CL with Vercel hosting the React frontend and Render hosting the Node.js backend.

---

## 📋 Prerequisites

### 1. **Accounts Required**
- ✅ Vercel account (free at [vercel.com](https://vercel.com))
- ✅ Render account (free tier at [render.com](https://render.com))
- ✅ GitHub account with VSBH-CL repository

### 2. **Project Structure Ready**
- ✅ Frontend in `client/` directory
- ✅ Backend in `server/` directory
- ✅ Environment variables configured
- ✅ Build scripts ready

---

## 🎯 Deployment Strategy

### **Frontend (Vercel)**
- 🚀 Static React app deployment
- ⚡ Global CDN distribution
- 🔒 Automatic HTTPS
- 🔄 Git-based deployments

### **Backend (Render)**
- 🖥️ Node.js server deployment
- 🔄 Auto-deploys on GitHub push
- 🔒 Custom domain with HTTPS
- 📊 Built-in monitoring

---

## ⚙️ Step 1: Configure Backend for Render

### Update Backend CORS
```javascript
// server/index.js - Add this CORS configuration
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### Update Environment Variables
```env
# server/.env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=your_render_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication
ADMIN_KEY=your_secure_admin_key
JWT_SECRET=your_jwt_secret

# Frontend URL (for CORS)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## ⚙️ Step 2: Configure Frontend for Vercel

### Update API URLs
```env
# client/.env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

### Update Socket.IO Client
```javascript
// client/src/services/socket.js
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  secure: true,
  rejectUnauthorized: false
});
```

---

## 🚀 Step 3: Deploy Backend to Render

### 1. Create New Web Service
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. **Connect GitHub** repository
4. Select **"vsbh-cricleague"** repository
5. Configure service:

#### **Service Configuration:**
```
Name: vsbh-cl-backend
Environment: Node
Region: Choose nearest to your users
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
Instance Type: Free (to start)
```

#### **Environment Variables:**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ADMIN_KEY=your_secure_admin_key
JWT_SECRET=your_jwt_secret
```

### 2. Deploy and Get URL
- Click **"Create Web Service"**
- Wait for deployment (2-3 minutes)
- Copy your Render URL: `https://your-app.onrender.com`

---

## 🚀 Step 4: Deploy Frontend to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy Project
```bash
# From project root
cd client

# Deploy to Vercel
vercel --prod
```

### 3. Configure Vercel Project
When prompted:
```
? Set up and deploy "~/client"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? vsbh-cl-frontend
? In which directory is your code located? ./
? Want to override the settings? [y/N] y
```

### 4. Configure Environment Variables
In Vercel dashboard or via CLI:
```
REACT_APP_API_URL=https://your-render-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

---

## 🔗 Step 5: Connect Frontend to Backend

### Update Vercel Configuration
Create `vercel.json` in client directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-render-app.onrender.com/api/$1"
    },
    {
      "src": "/socket.io/(.*)",
      "dest": "https://your-render-app.onrender.com/socket.io/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://your-render-app.onrender.com/api",
    "REACT_APP_SOCKET_URL": "https://your-render-app.onrender.com"
  }
}
```

---

## 🔄 Step 6: Test the Deployment

### 1. Check Backend Health
```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

### 2. Check Frontend
- Visit your Vercel URL
- Test login functionality
- Verify API calls work
- Test Socket.IO connection

### 3. Test Admin Functionality
- Login with admin credentials
- Test admin reset API
- Verify auction system works

---

## 🌐 Custom Domain Setup (Optional)

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Select your project
3. Go to **"Settings"** → **"Domains"**
4. Add your custom domain
5. Update DNS records as instructed

### Backend (Render)
1. Go to Render dashboard
2. Select your service
3. Go to **"Settings"** → **"Custom Domains"**
4. Add your custom domain
5. Update DNS records

---

## 🔄 Auto-Deploy Setup

### Backend (Render)
- ✅ Already configured - auto-deploys on GitHub push
- ✅ Zero-downtime deployments
- ✅ Automatic rollbacks on failure

### Frontend (Vercel)
```bash
# Connect GitHub repository to Vercel
vercel link

# Deploy on push to main branch
vercel --prod
```

Or set up in Vercel dashboard:
1. Go to project settings
2. Connect GitHub repository
3. Configure deploy hooks
4. Enable auto-deploy on main branch

---

## 📊 Monitoring & Logs

### Render (Backend)
- **Dashboard**: [render.com/dashboard](https://render.com/dashboard)
- **Logs**: Service → Logs
- **Metrics**: Service → Metrics
- **Health Checks**: Automatic every 30s

### Vercel (Frontend)
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Logs**: Functions tab
- **Analytics**: Built-in analytics
- **Performance**: Speed insights

---

## 🔧 Troubleshooting

### Common Issues

#### **CORS Errors**
```javascript
// server/index.js - Ensure proper CORS
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

#### **Socket.IO Connection Issues**
```javascript
// client/src/services/socket.js
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  secure: true
});
```

#### **Environment Variables**
```bash
# Verify environment variables are set
# Render: Dashboard → Service → Environment
# Vercel: Dashboard → Project → Environment Variables
```

#### **Build Failures**
```bash
# Check build logs
# Render: Service → Events
# Vercel: Functions tab → Logs
```

---

## 🎯 Production URLs

After successful deployment:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-api.onrender.com`
- **API**: `https://your-api.onrender.com/api`
- **Health**: `https://your-api.onrender.com/health`

---

## 🎉 Success!

Your VSBH-CL application is now:

- ✅ **Globally Available** via CDN (Vercel)
- ✅ **Scalable Backend** with monitoring (Render)
- ✅ **Auto-Deploying** on GitHub push
- ✅ **HTTPS Enabled** on both services
- ✅ **Production Ready** for tournament use

---

## 📞 Support

### Platform Support
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Render**: [render.com/support](https://render.com/support)

### Project Support
- **Email**: prasoon7pathak@gmail.com
- **GitHub Issues**: [Create Issue](https://github.com/pathakpk7/vsbh-cricleague/issues)

---

**🚀 Your VSBH Cricket League is now live with Vercel + Render!**
