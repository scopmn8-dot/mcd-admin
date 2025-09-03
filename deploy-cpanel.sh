#!/bin/bash

# MCD ADMIN cPanel Deployment Preparation Script

set -e  # Exit on any error

echo "🚀 Preparing MCD ADMIN for cPanel deployment..."

# Create deployment directory
echo "📁 Creating deployment package..."
rm -rf cpanel-deploy
mkdir -p cpanel-deploy/public

# Build frontend for production
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build

# Copy backend files to deployment package
echo "📦 Packaging backend files..."
cd ..
cp -r backend/* cpanel-deploy/
rm -f cpanel-deploy/package-lock.json  # Will be regenerated on cPanel

# Copy frontend build to public directory
echo "📁 Copying frontend build..."
cp -r frontend/build/* cpanel-deploy/public/

# Create cPanel-specific configuration
echo "⚙️  Creating cPanel configuration..."

# Update package.json for cPanel
cat > cpanel-deploy/package.json << 'EOF'
{
  "name": "mcd-admin-backend",
  "version": "1.0.0",
  "description": "Miles Car Delivery Administration System - Backend",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "cpanel-setup": "npm install --production"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "googleapis": "^159.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "keywords": ["logistics", "delivery", "admin", "cpanel"],
  "author": "Miles Car Delivery",
  "license": "ISC"
}
EOF

# Create .htaccess for security
cat > cpanel-deploy/.htaccess << 'EOF'
# Security settings for MCD ADMIN

# Deny access to sensitive files
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "google-credentials.json">
    Order allow,deny
    Deny from all
</Files>

<Files "users.json">
    Order allow,deny
    Deny from all
</Files>

<Files "processed-jobs.json">
    Order allow,deny
    Deny from all
</Files>

<Files "package.json">
    Order allow,deny
    Deny from all
</Files>

# Allow access to public folder
<Directory "public">
    Order allow,deny
    Allow from all
    
    # Enable compression for static files
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive on
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/ico "access plus 1 year"
        ExpiresByType image/icon "access plus 1 year"
        ExpiresByType text/ico "access plus 1 year"
        ExpiresByType application/ico "access plus 1 year"
    </IfModule>
</Directory>

# Force HTTPS (uncomment when SSL is configured)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
EOF

# Create environment file template for cPanel
cat > cpanel-deploy/.env.cpanel << 'EOF'
# MCD ADMIN Environment Configuration for cPanel

# IMPORTANT: Rename this file to .env and update values below

# Application Environment
NODE_ENV=production

# Server Configuration (cPanel usually handles this)
PORT=3001

# Security - CHANGE THIS!
JWT_SECRET=change-this-to-a-secure-random-string-for-production

# CORS Configuration - Update with your actual domain
CORS_ORIGIN=https://yourdomain.com

# Logging Level
LOG_LEVEL=info

# Optional: If you move to external database later
# DATABASE_URL=mysql://username:password@localhost:3306/mcd_admin
EOF

# Create cPanel setup instructions
cat > cpanel-deploy/CPANEL_SETUP.txt << 'EOF'
MCD ADMIN - cPanel Setup Instructions

1. UPLOAD FILES:
   - Upload all files from this folder to your cPanel public_html/mcd-admin/
   - Ensure file permissions are correct (755 for folders, 644 for files)

2. NODE.JS APP SETUP:
   a) Go to cPanel → Node.js App
   b) Click "Create Application"
   c) Configuration:
      - Node.js version: 18.x or latest available
      - Application mode: Production
      - Application root: /mcd-admin (or full path)
      - Application URL: yourdomain.com/mcd-admin
      - Application startup file: index.js

3. INSTALL DEPENDENCIES:
   a) Open Terminal in cPanel (if available) OR
   b) Use Node.js App terminal
   c) Run: cd /path/to/mcd-admin && npm install --production

4. ENVIRONMENT CONFIGURATION:
   a) Rename .env.cpanel to .env
   b) Edit .env file:
      - Update JWT_SECRET with a secure random string
      - Update CORS_ORIGIN with your actual domain
      - Save changes

5. GOOGLE SHEETS SETUP:
   a) Upload your google-credentials.json file
   b) Set permissions to 644
   c) Test Google Sheets connection

6. SSL CERTIFICATE (Recommended):
   a) Go to cPanel → SSL/TLS
   b) Install SSL certificate (Let's Encrypt is free)
   c) Uncomment HTTPS redirect in .htaccess

7. TEST DEPLOYMENT:
   a) Visit your domain/mcd-admin
   b) Should show login page
   c) Check error logs if issues occur

8. TROUBLESHOOTING:
   - Check cPanel Error Logs
   - Verify Node.js version compatibility
   - Ensure all files uploaded correctly
   - Contact hosting support if Node.js not available

For detailed instructions, see CPANEL_DEPLOYMENT_GUIDE.md
EOF

# Create deployment summary
echo ""
echo "✅ cPanel deployment package ready!"
echo ""
echo "📦 Package location: cpanel-deploy/"
echo "📁 Files to upload to cPanel:"
echo "   - All files in cpanel-deploy/"
echo "   - Upload to public_html/mcd-admin/ (or your domain folder)"
echo ""
echo "📋 Next steps:"
echo "   1. Upload files to cPanel via File Manager or FTP"
echo "   2. Create Node.js App in cPanel"
echo "   3. Rename .env.cpanel to .env and configure"
echo "   4. Run 'npm install --production' in cPanel terminal"
echo "   5. Test your deployment"
echo ""
echo "📖 See cpanel-deploy/CPANEL_SETUP.txt for detailed instructions"
echo ""

# Show package contents
echo "📂 Package contents:"
ls -la cpanel-deploy/

echo ""
echo "🎯 Ready for cPanel deployment!"
