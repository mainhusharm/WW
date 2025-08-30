#!/bin/bash

# Deploy to Render Helper Script
set -e

echo "🚀 TraderEdge Pro - Render Deployment Helper"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is available
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
}

# Check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "This directory is not a Git repository."
        print_status "Please run: git init && git add . && git commit -m 'Initial commit'"
        exit 1
    fi
}

# Check current git status
check_git_status() {
    print_status "Checking Git status..."
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes:"
        git status --short
        
        read -p "Do you want to commit these changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Deploy to Render - $(date)"
            print_success "Changes committed successfully"
        else
            print_warning "Please commit your changes before deploying"
            exit 1
        fi
    else
        print_success "Working directory is clean"
    fi
}

# Check if remote origin exists
check_remote() {
    if ! git remote get-url origin &> /dev/null; then
        print_error "No remote origin found."
        print_status "Please add your Render repository as origin:"
        print_status "git remote add origin <your-render-repo-url>"
        exit 1
    fi
    
    print_success "Remote origin found: $(git remote get-url origin)"
}

# Test build locally
test_build() {
    print_status "Testing production build locally..."
    
    if [ ! -f "build-production.sh" ]; then
        print_error "build-production.sh not found. Please ensure it exists."
        exit 1
    fi
    
    chmod +x build-production.sh
    
    if ./build-production.sh --test; then
        print_success "Local build test passed"
    else
        print_error "Local build test failed. Please fix issues before deploying."
        exit 1
    fi
}

# Push to remote
push_to_remote() {
    print_status "Pushing to remote repository..."
    
    if git push origin main; then
        print_success "Code pushed to remote successfully"
    else
        print_error "Failed to push to remote. Please check your Git configuration."
        exit 1
    fi
}

# Show deployment status
show_deployment_status() {
    echo
    echo "🎉 Deployment initiated successfully!"
    echo "====================================="
    echo
    print_status "Your code has been pushed to Render and deployment should start automatically."
    echo
    print_status "Next steps:"
    echo "1. Go to your Render dashboard: https://dashboard.render.com"
    echo "2. Check the deployment status of your services"
    echo "3. Monitor the build logs for any issues"
    echo "4. Wait for all services to be healthy"
    echo
    print_status "Services being deployed:"
    echo "- trading-bot-frontend (React app)"
    echo "- trading-journal-backend (Python API)"
    echo "- trading-journal-db (PostgreSQL)"
    echo "- binance-service (Node.js)"
    echo "- forex-data-service (Python)"
    echo "- customer-service (Node.js)"
    echo "- lot-size-calculator (Node.js)"
    echo
    print_status "Expected deployment time: 5-15 minutes"
    echo
    print_status "If you encounter issues:"
    echo "- Check the RENDER_DEPLOYMENT_GUIDE.md file"
    echo "- Review RENDER_FIXES_SUMMARY.md for troubleshooting"
    echo "- Check Render build logs for specific errors"
}

# Main deployment flow
main() {
    echo
    print_status "Starting deployment process..."
    
    # Run all checks
    check_git
    check_git_repo
    check_git_status
    check_remote
    test_build
    
    # Confirm deployment
    echo
    print_warning "Ready to deploy to Render!"
    print_status "This will push your code to the remote repository."
    echo
    
    read -p "Do you want to continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Deploy
    push_to_remote
    show_deployment_status
}

# Run main function
main "$@"
