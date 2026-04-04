@echo off
REM VSBH-CL Environment Setup Helper
REM This script helps you generate secrets and set up environment variables

echo 🔐 VSBH-CL Environment Setup Helper
echo ===================================

echo ℹ️  This script will help you generate:
echo   🔑 JWT_SECRET (for token authentication)
echo   🔑 ADMIN_KEY (for admin access)
echo   📋 Environment variable templates
echo.

REM Generate JWT Secret
echo 🔑 Generating JWT Secret...
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))" > temp_jwt.txt
set /p JWT_SECRET=<temp_jwt.txt
echo ✅ JWT_SECRET generated: %JWT_SECRET%

REM Generate Admin Key
echo 🔑 Generating ADMIN_KEY...
node -e "console.log('ADMIN_KEY=vsbh-admin-' + Math.random().toString(36).substring(2, 15) + '-2024')" > temp_admin.txt
set /p ADMIN_KEY=<temp_admin.txt
echo ✅ ADMIN_KEY generated: %ADMIN_KEY%

REM Clean up temp files
del temp_jwt.txt temp_admin.txt

echo.
echo 📋 Environment Variable Templates:
echo ==================================

echo.
echo 🖥️  For Render (Backend):
echo -------------------------
echo NODE_ENV=production
echo PORT=5000
echo DATABASE_URL=your_supabase_database_url
echo SUPABASE_URL=your_supabase_project_url
echo SUPABASE_SERVICE_KEY=your_supabase_service_key
echo ADMIN_KEY=%ADMIN_KEY%
echo JWT_SECRET=%JWT_SECRET%
echo FRONTEND_URL=https://your-vercel-app.vercel.app
echo LOG_LEVEL=info

echo.
echo 📱 For Vercel (Frontend):
echo ------------------------
echo REACT_APP_API_URL=https://your-render-app.onrender.com/api
echo REACT_APP_SOCKET_URL=https://your-render-app.onrender.com

echo.
echo 🔗 Supabase Setup:
echo -----------------
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project
echo 3. Settings → API → Copy Project URL and service_role key
echo 4. Settings → Database → Copy connection string

echo.
echo 🚀 Next Steps:
echo =============
echo 1. Deploy backend to Render with these environment variables
echo 2. Deploy frontend to Vercel
echo 3. Update FRONTEND_URL with actual Vercel URL
echo 4. Update Vercel with actual Render URL

echo.
echo 💾 Save these values somewhere safe!
echo 📝 Copy them to your environment variable files

pause
