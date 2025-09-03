#!/bin/bash

# MCD ADMIN Deployment Script
# Usage: ./deploy.sh [production|development]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}

echo "🚀 Starting MCD ADMIN deployment for $ENVIRONMENT environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🔧 Installing frontend dependencies..."
cd ../frontend
npm install

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🏗️  Building frontend for production..."
    npm run build
    
    echo "✅ Build completed successfully!"
    echo "📁 Built files are in frontend/build/"
    
    # Copy environment file if it doesn't exist
    if [ ! -f "../backend/.env" ]; then
        echo "📝 Creating environment file from example..."
        cp "../backend/.env.example" "../backend/.env"
        echo "⚠️  Please edit backend/.env with your production values!"
    fi
    
    echo "🚀 Starting production server..."
    cd ../backend
    NODE_ENV=production npm start
else
    echo "🔧 Starting development servers..."
    echo "📝 Frontend will run on http://localhost:3000"
    echo "🔌 Backend will run on http://localhost:3001"
    echo ""
    echo "To start development:"
    echo "Terminal 1: cd backend && npm start"
    echo "Terminal 2: cd frontend && npm start"
fi

echo "✅ Deployment script completed!"
