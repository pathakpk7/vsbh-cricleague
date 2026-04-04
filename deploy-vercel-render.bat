@echo off
REM VSBH-CL Vercel + Render Deployment Script
REM This script helps you deploy frontend to Vercel and backend to Render

echo 🚀 VSBH-CL Vercel + Render Deployment Script
echo ===============================================

echo ℹ️  This deployment will:
echo   📱 Deploy frontend to Vercel ^(static React app^)
echo   🖥️  Deploy backend to Render ^(Node.js server^)
echo   🔗  Connect both services for full application
echo.

REM Check prerequisites
echo ℹ️  Checking prerequisites...

if not exist "node_modules" (
    echo ❌ Node.js dependencies not found. Run: npm install
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    echo ❌ Client dependencies not found. Run: cd client && npm install
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    echo ❌ Server dependencies not found. Run: cd server && npm install
    pause
    exit /b 1
)

echo ✅ All dependencies found

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Vercel CLI not found. Installing...
    npm install -g vercel
    echo ✅ Vercel CLI installed
)

echo ℹ️  Environment Configuration:
echo   📋 Please have these ready:
echo     1. Supabase URL and Service Key
echo     2. Admin Key for authentication
echo     3. JWT Secret for tokens
echo.

set /p env_ready="Do you have your environment variables ready? (y/n): "
if /i not "%env_ready%"=="y" (
    echo ❌ Please set up your environment variables first
    echo 📖 See: server/.env.production and client/.env.production
    pause
    exit /b 1
)

echo.
echo 🎯 Deployment Options:
echo 1) 🚀 Deploy Both Services ^(Recommended^)
echo 2) 📱 Deploy Frontend Only ^(Vercel^)
echo 3) 🖥️  Deploy Backend Only ^(Render^)
echo 4) 📋 View Deployment Guide
echo.

set /p deploy_option="Choose option (1-4): "

if "%deploy_option%"=="1" goto deploy_both
if "%deploy_option%"=="2" goto deploy_frontend
if "%deploy_option%"=="3" goto deploy_backend
if "%deploy_option%"=="4" goto show_guide
goto invalid_option

:deploy_both
echo.
echo 🚀 Deploying Both Services
echo ========================

echo ℹ️  Step 1: Deploy Backend to Render
echo 📖 Opening Render dashboard...
start https://render.com/dashboard
echo.
echo ⚠️  Manual steps for Render:
echo   1. Click "New +" → "Web Service"
echo   2. Connect your GitHub repository
echo   3. Select "vsbh-cricleague" repository
echo   4. Configure service:
echo      - Name: vsbh-cl-backend
echo      - Environment: Node
echo      - Root Directory: server
echo      - Build Command: npm install
echo      - Start Command: npm start
echo   5. Add environment variables ^(see server/.env.production^)
echo   6. Click "Create Web Service"
echo.
set /p render_ready="Press Enter when Render service is created..."

echo ℹ️  Step 2: Deploy Frontend to Vercel
echo 📱 Deploying frontend to Vercel...
cd client
vercel --prod
cd ..

echo.
echo ✅ Both services deployed!
echo ℹ️  Next steps:
echo   1. Update environment variables with actual URLs
echo   2. Test the deployment
echo   3. Set up custom domains ^(optional^)
goto end

:deploy_frontend
echo.
echo 📱 Deploying Frontend to Vercel
echo ==============================
cd client
vercel --prod
cd ..
echo ✅ Frontend deployed to Vercel!
goto end

:deploy_backend
echo.
echo 🖥️  Deploying Backend to Render
echo ================================
echo 📖 Opening Render dashboard...
start https://render.com/dashboard
echo.
echo ⚠️  Please follow the manual steps in the deployment guide
echo 📖 Guide: VERCEL_RENDER_DEPLOYMENT.md
goto end

:show_guide
echo.
echo 📖 Vercel + Render Deployment Guide
echo =================================
echo 📄 Full guide: VERCEL_RENDER_DEPLOYMENT.md
echo 🌐 Open guide...
start VERCEL_RENDER_DEPLOYMENT.md
goto end

:invalid_option
echo ❌ Invalid option selected
pause
exit /b 1

:end
echo.
echo 🎉 Deployment Process Complete!
echo ============================
echo.
echo 📋 Important Files:
echo   📄 Environment templates:
echo     - server/.env.production
echo     - client/.env.production
echo   📖 Deployment guide:
echo     - VERCEL_RENDER_DEPLOYMENT.md
echo.
echo 🔗 Quick Links:
echo   📱 Vercel Dashboard: https://vercel.com/dashboard
echo   🖥️  Render Dashboard: https://render.com/dashboard
echo   🐙  GitHub Repository: https://github.com/pathakpk7/vsbh-cricleague
echo.
echo 📞 Need help?
echo   📧 Email: prasoon7pathak@gmail.com
echo   🐛 GitHub Issues: https://github.com/pathakpk7/vsbh-cricleague/issues
echo.
echo 🏏 Good luck with your VSBH Cricket League deployment! 🚀
pause
