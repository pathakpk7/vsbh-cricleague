@echo off
REM VSBH-CL GitHub Deployment Script (Windows)
REM This script helps you deploy your project to GitHub with proper configuration

echo 🚀 VSBH-CL GitHub Deployment Script
echo ==================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the VSBH-CL root directory
    pause
    exit /b 1
)

if not exist "client" (
    echo ❌ Please run this script from the VSBH-CL root directory
    pause
    exit /b 1
)

if not exist "server" (
    echo ❌ Please run this script from the VSBH-CL root directory
    pause
    exit /b 1
)

REM Check git status
echo ℹ️  Checking git status...
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  You have uncommitted changes
    set /p commit_changes="Would you like to commit them? (y/n): "
    if /i "%commit_changes%"=="y" (
        echo ℹ️  Adding all files...
        git add .
        
        echo ℹ️  Please enter a commit message:
        set /p commit_message="Commit message: "
        
        if "%commit_message%"=="" set commit_message=Update VSBH-CL deployment configuration
        
        echo ℹ️  Committing changes...
        git commit -m "%commit_message%"
        echo ✅ Changes committed
    ) else (
        echo ⚠️  Please commit your changes before deploying
        pause
        exit /b 1
    )
) else (
    echo ✅ Working directory is clean
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
echo ℹ️  Current branch: %current_branch%

if not "%current_branch%"=="main" (
    echo ⚠️  You're not on the main branch
    set /p switch_branch="Would you like to switch to main branch? (y/n): "
    if /i "%switch_branch%"=="y" (
        git checkout main
        echo ✅ Switched to main branch
    ) else (
        echo ⚠️  Deploying from %current_branch% branch
    )
)

REM Check if remote exists
echo ℹ️  Checking remote repository...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No remote repository found
    echo ℹ️  Please add your GitHub repository:
    echo git remote add origin https://github.com/pathakpk7/vsbh-cricleague.git
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git remote get-url origin') do set remote_url=%%i
echo ✅ Remote repository: %remote_url%

REM Push to GitHub
echo ℹ️  Pushing to GitHub...
git push origin %current_branch%
echo ✅ Code pushed to GitHub

echo.
echo ℹ️  Deployment Options:
echo 1) 🐳 Docker Deployment ^(Recommended for production^)
echo 2) ⚡ Vercel Deployment ^(Frontend + Serverless^)
echo 3) 🚂 Railway Deployment ^(Backend as service^)
echo 4) 🔵 Netlify Deployment ^(Static frontend^)
echo 5) 📋 Just push to GitHub ^(manual setup^)

echo.
set /p deploy_option="Choose deployment option ^(1-5^): "

if "%deploy_option%"=="1" (
    echo ℹ️  Docker Deployment Selected
    echo ℹ️  Please follow the GITHUB_DEPLOYMENT.md guide for:
    echo   - Server setup
    echo   - GitHub secrets configuration
    echo   - SSH key setup
    echo.
    echo 📖 Guide: GITHUB_DEPLOYMENT.md
    echo 🌐 After setup, your app will be available at your domain
)
if "%deploy_option%"=="2" (
    echo ℹ️  Vercel Deployment Selected
    echo ℹ️  To deploy to Vercel:
    echo   1. Install Vercel CLI: npm i -g vercel
    echo   2. Run: vercel
    echo   3. Connect your GitHub account
    echo   4. Import this repository
    echo.
    echo 🔗 Vercel Dashboard: https://vercel.com/dashboard
)
if "%deploy_option%"=="3" (
    echo ℹ️  Railway Deployment Selected
    echo ℹ️  To deploy to Railway:
    echo   1. Go to: https://railway.app/new
    echo   2. Choose 'Deploy from GitHub repo'
    echo   3. Select this repository
    echo   4. Configure environment variables
    echo.
    echo 🔗 Railway: https://railway.app
)
if "%deploy_option%"=="4" (
    echo ℹ️  Netlify Deployment Selected
    echo ℹ️  To deploy to Netlify:
    echo   1. Go to: https://app.netlify.com/drop
    echo   2. Drag and drop the 'client/build' folder
    echo   3. Or connect GitHub repository for auto-deploys
    echo.
    echo 🔗 Netlify: https://netlify.com
)
if "%deploy_option%"=="5" (
    echo ℹ️  GitHub Push Complete
    echo ℹ️  Your code is now on GitHub
    echo ℹ️  You can manually set up deployment using:
    echo   - GitHub Actions ^(see .github/workflows/deploy.yml^)
    echo   - Docker containers
    echo   - Cloud platform services
)

echo.
echo ✅ 🎉 VSBH-CL is ready for deployment!
echo.
echo ℹ️  Next Steps:
echo 1. Choose your deployment platform
echo 2. Configure environment variables
echo 3. Set up domain and SSL
echo 4. Test the deployment
echo.
echo ℹ️  Documentation:
echo 📖 Full Guide: GITHUB_DEPLOYMENT.md
echo 📖 README.md: Complete project documentation
echo 📖 PROJECT_COMPLETE.md: Project completion summary
echo.
echo ℹ️  Support:
echo 📧 Email: prasoon7pathak@gmail.com
echo 💬 GitHub Issues: https://github.com/pathakpk7/vsbh-cricleague/issues
echo.
echo 🏏 Good luck with your VSBH Cricket League! 🚀
pause
