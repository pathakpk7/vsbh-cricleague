#!/bin/bash

# VSBH-CL GitHub Deployment Script
# This script helps you deploy your project to GitHub with proper configuration

set -e

echo "🚀 VSBH-CL GitHub Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "Please run this script from the VSBH-CL root directory"
    exit 1
fi

# Check git status
print_info "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    read -p "Would you like to commit them? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Adding all files..."
        git add .
        
        print_info "Please enter a commit message:"
        read commit_message
        
        if [ -z "$commit_message" ]; then
            commit_message="Update VSBH-CL deployment configuration"
        fi
        
        print_info "Committing changes..."
        git commit -m "$commit_message"
        print_success "Changes committed"
    else
        print_warning "Please commit your changes before deploying"
        exit 1
    fi
else
    print_success "Working directory is clean"
fi

# Check current branch
current_branch=$(git branch --show-current)
print_info "Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
    print_warning "You're not on the main branch"
    read -p "Would you like to switch to main branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        print_success "Switched to main branch"
    else
        print_warning "Deploying from $current_branch branch"
    fi
fi

# Check if remote exists
print_info "Checking remote repository..."
if ! git remote get-url origin >/dev/null 2>&1; then
    print_error "No remote repository found"
    print_info "Please add your GitHub repository:"
    echo "git remote add origin https://github.com/pathakpk7/vsbh-cricleague.git"
    exit 1
fi

remote_url=$(git remote get-url origin)
print_success "Remote repository: $remote_url"

# Push to GitHub
print_info "Pushing to GitHub..."
git push origin $(git branch --show-current)
print_success "Code pushed to GitHub"

# Deployment options
echo ""
print_info "Deployment Options:"
echo "1) 🐳 Docker Deployment (Recommended for production)"
echo "2) ⚡ Vercel Deployment (Frontend + Serverless)"
echo "3) 🚂 Railway Deployment (Backend as service)"
echo "4) 🔵 Netlify Deployment (Static frontend)"
echo "5) 📋 Just push to GitHub (manual setup)"

echo ""
read -p "Choose deployment option (1-5): " -n 1 -r
echo
case $REPLY in
    1)
        print_info "Docker Deployment Selected"
        print_info "Please follow the GITHUB_DEPLOYMENT.md guide for:"
        echo "  - Server setup"
        echo "  - GitHub secrets configuration"
        echo "  - SSH key setup"
        echo ""
        echo "📖 Guide: GITHUB_DEPLOYMENT.md"
        echo "🌐 After setup, your app will be available at your domain"
        ;;
    2)
        print_info "Vercel Deployment Selected"
        print_info "To deploy to Vercel:"
        echo "  1. Install Vercel CLI: npm i -g vercel"
        echo "  2. Run: vercel"
        echo "  3. Connect your GitHub account"
        echo "  4. Import this repository"
        echo ""
        echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
        ;;
    3)
        print_info "Railway Deployment Selected"
        print_info "To deploy to Railway:"
        echo "  1. Go to: https://railway.app/new"
        echo "  2. Choose 'Deploy from GitHub repo'"
        echo "  3. Select this repository"
        echo "  4. Configure environment variables"
        echo ""
        echo "🔗 Railway: https://railway.app"
        ;;
    4)
        print_info "Netlify Deployment Selected"
        print_info "To deploy to Netlify:"
        echo "  1. Go to: https://app.netlify.com/drop"
        echo "  2. Drag and drop the 'client/build' folder"
        echo "  3. Or connect GitHub repository for auto-deploys"
        echo ""
        echo "🔗 Netlify: https://netlify.com"
        ;;
    5)
        print_info "GitHub Push Complete"
        print_info "Your code is now on GitHub"
        print_info "You can manually set up deployment using:"
        echo "  - GitHub Actions (see .github/workflows/deploy.yml)"
        echo "  - Docker containers"
        echo "  - Cloud platform services"
        ;;
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

echo ""
print_success "🎉 VSBH-CL is ready for deployment!"
echo ""
print_info "Next Steps:"
echo "1. Choose your deployment platform"
echo "2. Configure environment variables"
echo "3. Set up domain and SSL"
echo "4. Test the deployment"
echo ""
print_info "Documentation:"
echo "📖 Full Guide: GITHUB_DEPLOYMENT.md"
echo "📖 README.md: Complete project documentation"
echo "📖 PROJECT_COMPLETE.md: Project completion summary"
echo ""
print_info "Support:"
echo "📧 Email: prasoon7pathak@gmail.com"
echo "💬 GitHub Issues: https://github.com/pathakpk7/vsbh-cricleague/issues"
echo ""
echo "🏏 Good luck with your VSBH Cricket League! 🚀"
