@echo off
REM MCD ADMIN cPanel Deployment Preparation Script for Windows

setlocal enabledelayedexpansion

echo 🚀 Preparing MCD ADMIN for cPanel deployment...

REM Create deployment directory
echo 📁 Creating deployment package...
if exist cpanel-deploy rmdir /s /q cpanel-deploy
mkdir cpanel-deploy\public

REM Build frontend for production
echo 🏗️  Building frontend...
cd frontend
call npm install
call npm run build

REM Copy backend files to deployment package
echo 📦 Packaging backend files...
cd ..
xcopy backend\* cpanel-deploy\ /e /i /h /y
if exist cpanel-deploy\package-lock.json del cpanel-deploy\package-lock.json

REM Copy frontend build to public directory
echo 📁 Copying frontend build...
xcopy frontend\build\* cpanel-deploy\public\ /e /i /h /y

REM Create cPanel-specific configuration
echo ⚙️  Creating cPanel configuration...

REM Update package.json for cPanel
(
echo {
echo   "name": "mcd-admin-backend",
echo   "version": "1.0.0",
echo   "description": "Miles Car Delivery Administration System - Backend",
echo   "main": "index.js",
echo   "type": "module",
echo   "scripts": {
echo     "start": "node index.js",
echo     "cpanel-setup": "npm install --production"
echo   },
echo   "dependencies": {
echo     "cors": "^2.8.5",
echo     "express": "^4.18.2",
echo     "googleapis": "^159.0.0",
echo     "bcryptjs": "^2.4.3",
echo     "jsonwebtoken": "^9.0.0"
echo   },
echo   "engines": {
echo     "node": "^>=18.0.0",
echo     "npm": "^>=9.0.0"
echo   },
echo   "keywords": ["logistics", "delivery", "admin", "cpanel"],
echo   "author": "Miles Car Delivery",
echo   "license": "ISC"
echo }
) > cpanel-deploy\package.json

REM Create .htaccess for security
(
echo # Security settings for MCD ADMIN
echo.
echo # Deny access to sensitive files
echo ^<Files ".env"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo ^<Files "google-credentials.json"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo ^<Files "users.json"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo ^<Files "processed-jobs.json"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo ^<Files "package.json"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo # Allow access to public folder
echo ^<Directory "public"^>
echo     Order allow,deny
echo     Allow from all
echo ^</Directory^>
) > cpanel-deploy\.htaccess

REM Create environment file template for cPanel
(
echo # MCD ADMIN Environment Configuration for cPanel
echo.
echo # IMPORTANT: Rename this file to .env and update values below
echo.
echo # Application Environment
echo NODE_ENV=production
echo.
echo # Server Configuration ^^(cPanel usually handles this^^)
echo PORT=3001
echo.
echo # Security - CHANGE THIS!
echo JWT_SECRET=change-this-to-a-secure-random-string-for-production
echo.
echo # CORS Configuration - Update with your actual domain
echo CORS_ORIGIN=https://yourdomain.com
echo.
echo # Logging Level
echo LOG_LEVEL=info
echo.
echo # Optional: If you move to external database later
echo # DATABASE_URL=mysql://username:password@localhost:3306/mcd_admin
) > cpanel-deploy\.env.cpanel

REM Create cPanel setup instructions
(
echo MCD ADMIN - cPanel Setup Instructions
echo.
echo 1. UPLOAD FILES:
echo    - Upload all files from this folder to your cPanel public_html/mcd-admin/
echo    - Ensure file permissions are correct ^^(755 for folders, 644 for files^^)
echo.
echo 2. NODE.JS APP SETUP:
echo    a^^) Go to cPanel → Node.js App
echo    b^^) Click "Create Application"
echo    c^^) Configuration:
echo       - Node.js version: 18.x or latest available
echo       - Application mode: Production
echo       - Application root: /mcd-admin ^^(or full path^^)
echo       - Application URL: yourdomain.com/mcd-admin
echo       - Application startup file: index.js
echo.
echo 3. INSTALL DEPENDENCIES:
echo    a^^) Open Terminal in cPanel ^^(if available^^) OR
echo    b^^) Use Node.js App terminal
echo    c^^) Run: cd /path/to/mcd-admin ^&^& npm install --production
echo.
echo 4. ENVIRONMENT CONFIGURATION:
echo    a^^) Rename .env.cpanel to .env
echo    b^^) Edit .env file:
echo       - Update JWT_SECRET with a secure random string
echo       - Update CORS_ORIGIN with your actual domain
echo       - Save changes
echo.
echo 5. GOOGLE SHEETS SETUP:
echo    a^^) Upload your google-credentials.json file
echo    b^^) Set permissions to 644
echo    c^^) Test Google Sheets connection
echo.
echo 6. SSL CERTIFICATE ^^(Recommended^^):
echo    a^^) Go to cPanel → SSL/TLS
echo    b^^) Install SSL certificate ^^(Let's Encrypt is free^^)
echo    c^^) Update CORS_ORIGIN to use https://
echo.
echo 7. TEST DEPLOYMENT:
echo    a^^) Visit your domain/mcd-admin
echo    b^^) Should show login page
echo    c^^) Check error logs if issues occur
echo.
echo 8. TROUBLESHOOTING:
echo    - Check cPanel Error Logs
echo    - Verify Node.js version compatibility
echo    - Ensure all files uploaded correctly
echo    - Contact hosting support if Node.js not available
echo.
echo For detailed instructions, see CPANEL_DEPLOYMENT_GUIDE.md
) > cpanel-deploy\CPANEL_SETUP.txt

REM Show completion message
echo.
echo ✅ cPanel deployment package ready!
echo.
echo 📦 Package location: cpanel-deploy\
echo 📁 Files to upload to cPanel:
echo    - All files in cpanel-deploy\
echo    - Upload to public_html\mcd-admin\ ^^(or your domain folder^^)
echo.
echo 📋 Next steps:
echo    1. Upload files to cPanel via File Manager or FTP
echo    2. Create Node.js App in cPanel
echo    3. Rename .env.cpanel to .env and configure
echo    4. Run 'npm install --production' in cPanel terminal
echo    5. Test your deployment
echo.
echo 📖 See cpanel-deploy\CPANEL_SETUP.txt for detailed instructions
echo.

REM Show package contents
echo 📂 Package contents:
dir cpanel-deploy

echo.
echo 🎯 Ready for cPanel deployment!
pause
