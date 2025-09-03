@echo off
REM MCD ADMIN Deployment Script for Windows
REM Usage: deploy.bat [production|development]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo 🚀 Starting MCD ADMIN deployment for %ENVIRONMENT% environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Show Node.js version
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo 📋 Node.js version: %NODE_VERSION%

REM Navigate to project root
cd /d %~dp0

echo 📦 Installing backend dependencies...
cd backend
call npm install

echo 🔧 Installing frontend dependencies...
cd ..\frontend
call npm install

if "%ENVIRONMENT%"=="production" (
    echo 🏗️  Building frontend for production...
    call npm run build
    
    echo ✅ Build completed successfully!
    echo 📁 Built files are in frontend/build/
    
    REM Copy environment file if it doesn't exist
    if not exist "..\backend\.env" (
        echo 📝 Creating environment file from example...
        copy "..\backend\.env.example" "..\backend\.env"
        echo ⚠️  Please edit backend\.env with your production values!
    )
    
    echo 🚀 Starting production server...
    cd ..\backend
    set NODE_ENV=production
    call npm start
) else (
    echo 🔧 Development mode selected
    echo 📝 Frontend will run on http://localhost:3000
    echo 🔌 Backend will run on http://localhost:3001
    echo.
    echo To start development:
    echo Terminal 1: cd backend ^&^& npm start
    echo Terminal 2: cd frontend ^&^& npm start
)

echo ✅ Deployment script completed!
pause
