# MCD ADMIN cPanel Deployment Guide

## 🌐 Deploying MCD ADMIN to cPanel Hosting

cPanel hosting is ideal for small to medium deployments. Here's how to deploy your MCD ADMIN system.

## 📋 Prerequisites

### cPanel Requirements:
- **Node.js support** (version 18+ recommended)
- **File Manager** or FTP access
- **Database** access (MySQL/PostgreSQL) - optional
- **SSL certificate** (recommended for production)
- **Subdomain/domain** configured

### Check if your cPanel supports Node.js:
1. Login to cPanel
2. Look for "Node.js App" or "Node.js Selector"
3. If not available, contact your hosting provider

## 🚀 Deployment Methods

### Method 1: Direct File Upload (Recommended)

#### Step 1: Prepare Your Files
```bash
# On your local machine, build the production version
cd frontend
npm run build

# Create deployment package
cd ..
mkdir mcd-admin-deploy
cp -r backend/* mcd-admin-deploy/
cp -r frontend/build mcd-admin-deploy/public
```

#### Step 2: Upload to cPanel
1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to public_html** (or your domain folder)
4. **Create folder**: `mcd-admin`
5. **Upload all files** from `mcd-admin-deploy` folder
6. **Extract if uploaded as ZIP**

#### Step 3: Set up Node.js App in cPanel
1. **Find "Node.js App"** in cPanel
2. **Click "Create Application"**
3. **Configure**:
   - **Node.js version**: 18.x or latest
   - **Application mode**: Production
   - **Application root**: `/mcd-admin`
   - **Application URL**: `yourdomain.com/mcd-admin` or subdomain
   - **Application startup file**: `index.js`

#### Step 4: Install Dependencies
1. **Open Terminal** in cPanel (if available)
2. **Or use Node.js App terminal**
```bash
cd /home/yourusername/public_html/mcd-admin
npm install --production
```

#### Step 5: Configure Environment
1. **Create `.env` file** in cPanel File Manager:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-secret-for-cpanel
CORS_ORIGIN=https://yourdomain.com
```

### Method 2: Git Deployment (If supported)

#### Step 1: Create Repository
```bash
# Initialize git in your project
git init
git add .
git commit -m "Initial MCD ADMIN deployment"

# Push to GitHub/GitLab
git remote add origin https://github.com/yourusername/mcd-admin.git
git push -u origin main
```

#### Step 2: Deploy via cPanel Git
1. **Find "Git Version Control"** in cPanel
2. **Clone Repository**:
   - Repository URL: `https://github.com/yourusername/mcd-admin.git`
   - Repository Path: `/mcd-admin`
3. **Set up deployment hooks**

### Method 3: FTP Upload

#### Using FTP Client (FileZilla, WinSCP, etc.)
1. **Connect to your cPanel FTP**
2. **Navigate to public_html/mcd-admin**
3. **Upload all backend files**
4. **Upload frontend/build contents to `/public` folder**

## 🔧 cPanel-Specific Configuration

### Update Backend for cPanel
Create `backend/cpanel-config.js`:
```javascript
// cPanel-specific configurations
const path = require('path');

module.exports = {
  // Serve static files from public folder
  staticPath: path.join(__dirname, 'public'),
  
  // cPanel often uses different port handling
  port: process.env.PORT || 3001,
  
  // Update paths for cPanel file structure
  credentialsPath: path.join(__dirname, 'google-credentials.json'),
  usersPath: path.join(__dirname, 'users.json'),
  processedJobsPath: path.join(__dirname, 'processed-jobs.json')
};
```

### Update index.js for cPanel
Add this to your `backend/index.js` before `app.listen()`:

```javascript
// cPanel static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing for cPanel
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

### Package.json for cPanel
Update `backend/package.json`:
```json
{
  "name": "mcd-admin-backend",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "cpanel-deploy": "npm install --production"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🗂️ cPanel File Structure

```
public_html/mcd-admin/
├── index.js                 # Main server file
├── package.json            # Dependencies
├── .env                    # Environment variables
├── google-credentials.json # Google API credentials
├── users.json             # User data
├── processed-jobs.json    # Job data
├── node_modules/          # Dependencies (after npm install)
└── public/                # React build files
    ├── index.html
    ├── static/
    │   ├── css/
    │   └── js/
    └── favicon.ico
```

## ⚙️ cPanel Configuration Steps

### 1. Domain/Subdomain Setup
```
Option A: Subdomain
- Create subdomain: admin.yourdomain.com
- Point to /mcd-admin folder

Option B: Directory
- Access via: yourdomain.com/mcd-admin
- Configure in main domain
```

### 2. SSL Certificate
1. **Go to "SSL/TLS"** in cPanel
2. **Install SSL certificate** (Let's Encrypt is free)
3. **Force HTTPS redirect**

### 3. Database Setup (Optional)
If you plan to add database later:
1. **MySQL Databases** in cPanel
2. **Create database**: `mcd_admin`
3. **Create user** with full permissions
4. **Update connection string** in `.env`

### 4. Cron Jobs (for automated tasks)
1. **Go to "Cron Jobs"** in cPanel
2. **Add job** for periodic tasks:
```bash
# Run every hour
0 * * * * /usr/bin/node /home/yourusername/public_html/mcd-admin/scripts/maintenance.js
```

## 🚨 Common cPanel Issues & Solutions

### Issue 1: Node.js Not Available
**Solution**: 
- Contact hosting provider to enable Node.js
- Consider upgrading hosting plan
- Use static hosting alternative

### Issue 2: Port Conflicts
**Problem**: cPanel might not allow custom ports
**Solution**: 
```javascript
// Use cPanel's assigned port
const PORT = process.env.PORT || 80;
```

### Issue 3: File Permissions
**Problem**: Permission denied errors
**Solution**:
```bash
# Set correct permissions
chmod 755 /path/to/mcd-admin
chmod 644 /path/to/mcd-admin/index.js
```

### Issue 4: Memory Limits
**Problem**: Out of memory errors
**Solution**:
- Optimize application
- Contact hosting provider
- Upgrade hosting plan

## 📊 cPanel Monitoring

### Enable Error Logging
Add to `.htaccess`:
```apache
php_flag log_errors on
php_value error_log /home/yourusername/public_html/mcd-admin/error.log
```

### Monitor Resource Usage
1. **CPU and Memory Usage** in cPanel
2. **Error Logs** section
3. **Access Logs** for traffic

## 🔒 Security for cPanel

### Protect Sensitive Files
Create `.htaccess` in root:
```apache
# Deny access to sensitive files
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "google-credentials.json">
    Order allow,deny
    Deny from all
</Files>

<Files "*.json">
    Order allow,deny
    Deny from all
</Files>

# Allow only index.html in public folder
<Directory "public">
    Order allow,deny
    Allow from all
</Directory>
```

### IP Restrictions (Optional)
```apache
# Allow only specific IPs to access admin
<RequireAll>
    Require ip 192.168.1.100
    Require ip 203.0.113.0/24
</RequireAll>
```

## 🚀 Quick Deployment Script for cPanel

Create `deploy-cpanel.sh`:
```bash
#!/bin/bash
echo "🚀 Deploying MCD ADMIN to cPanel..."

# Build frontend
cd frontend
npm run build

# Create deployment package
cd ..
mkdir -p cpanel-deploy/public
cp -r backend/* cpanel-deploy/
cp -r frontend/build/* cpanel-deploy/public/

# Create .htaccess for security
cat > cpanel-deploy/.htaccess << EOF
<Files ".env">
    Order allow,deny
    Deny from all
</Files>
EOF

echo "📦 Package created in cpanel-deploy/"
echo "📁 Upload cpanel-deploy/* to your cPanel public_html/mcd-admin/"
echo "⚙️  Configure Node.js App in cPanel"
echo "🔑 Update .env file with production values"
echo "✅ Run 'npm install --production' in cPanel terminal"
```

## ✅ Deployment Checklist

- [ ] cPanel supports Node.js
- [ ] Domain/subdomain configured
- [ ] Files uploaded to correct directory
- [ ] Node.js app created in cPanel
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables set (`.env` file)
- [ ] Google credentials uploaded
- [ ] SSL certificate installed
- [ ] Security files (.htaccess) configured
- [ ] Test application access
- [ ] Monitor error logs

## 📞 Hosting Provider Support

Most cPanel providers support Node.js:
- **Shared Hosting**: Basic Node.js support
- **VPS/Dedicated**: Full Node.js support
- **Managed WordPress**: Usually no Node.js

If your current provider doesn't support Node.js, consider:
- A2 Hosting
- InMotion Hosting
- SiteGround
- Hostinger
- Namecheap

## 🎯 Performance Tips for cPanel

1. **Enable Gzip** compression
2. **Use CDN** for static assets
3. **Optimize images** and assets
4. **Cache static files**
5. **Monitor resource usage**
6. **Regular cleanup** of logs and temp files

Your MCD ADMIN system should work perfectly on cPanel hosting with these configurations!
