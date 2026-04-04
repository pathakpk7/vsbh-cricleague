@echo off
REM VSBH-CL Database Setup Helper
REM This script helps you get your Supabase database password

echo 🔐 VSBH-CL Database Setup Helper
echo ================================

echo 📋 To get your DATABASE_URL, you need your Supabase database password
echo.
echo 🌐 Steps to get your password:
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project: qriibawpjsbazglbwohn
echo 3. Go to: Settings → Database
echo 4. Look for "Database password" or "Connection string"
echo 5. Copy the password from the connection string
echo.
echo 🔗 Your connection string format should be:
echo postgresql://postgres:[PASSWORD]@db.qriibawpjsbazglbwohn.supabase.co:5432/postgres
echo.
echo 📝 Once you have the password, enter it below:
echo.

set /p db_password="Enter your Supabase database password: "

if "%db_password%"=="" (
    echo ❌ Password cannot be empty
    pause
    exit /b 1
)

echo.
echo 🔧 Updating your DATABASE_URL...
echo DATABASE_URL=postgresql://postgres:%db_password%@db.qriibawpjsbazglbwohn.supabase.co:5432/postgres > temp_db_url.txt

echo ✅ DATABASE_URL updated!
echo.
echo 📋 Your DATABASE_URL is:
echo postgresql://postgres:%db_password%@db.qriibawpjsbazglbwohn.supabase.co:5432/postgres
echo.
echo 🚀 Now you need to:
echo 1. Add this to your Render environment variables
echo 2. Redeploy your Render service
echo 3. Test the health endpoint
echo.
echo 📞 When ready, tell me "database updated" and I'll help you deploy!

del temp_db_url.txt
pause
