# GitHub Actions Auto-Deployment Setup

## 🚀 Quick Setup Guide

### 1. Repository Setup
Your repository is already configured! The workflow file has been created at:
`.github/workflows/deploy.yml`

### 2. Configure GitHub Secrets
In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these three secrets:

#### Required Secrets:
- **Name:** `FTP_HOST`
  - **Value:** Your cPanel FTP hostname (e.g., `ftp.yourdomain.com` or `yourdomain.com`)

- **Name:** `FTP_USERNAME` 
  - **Value:** Your cPanel username

- **Name:** `FTP_PASSWORD`
  - **Value:** Your cPanel password

### 3. Deploy Your Project

#### Automatic Deployment:
- Push any changes to `main` or `master` branch
- GitHub Actions will automatically deploy to your cPanel
- Monitor progress in the **Actions** tab

#### Manual Deployment:
- Go to **Actions** tab in your repository
- Click on **Deploy to cPanel CloudLinux** workflow
- Click **Run workflow** button

### 4. After Deployment

The GitHub Action only handles file upload. You still need to:

1. **Go to cPanel → NodeJS Selector**
2. **Create Application:**
   - App Directory: `mcd-admin`
   - App URI: `mcd-admin` 
   - Node.js version: Latest (18.x+)
   - Startup file: `index.js`

3. **Install Dependencies:**
   - Click **Run NPM Install** in NodeJS Selector
   - Wait for completion

4. **Configure Environment:**
   - Rename `.env.cpanel` to `.env`
   - Edit with your domain settings

5. **Start Application:**
   - Click **Restart App** in NodeJS Selector

6. **Test:**
   - Visit: `https://yourdomain.com/mcd-admin`

## 🔧 How It Works

The workflow:
1. ✅ Checks out your code
2. ✅ Sets up Node.js environment  
3. ✅ Builds frontend if needed
4. ✅ Prepares deployment files (no node_modules)
5. ✅ Uploads via FTP to your cPanel
6. ⚠️  **You manually configure NodeJS Selector**

## 📝 Important Notes

- **CloudLinux Compatibility:** Dependencies are installed via cPanel NodeJS Selector, not during deployment
- **Security:** Never commit FTP credentials to your repository - use GitHub Secrets
- **File Exclusions:** node_modules, .git, and sensitive files are automatically excluded
- **Frontend Builds:** If you have a frontend/build folder, it will update the public folder

## 🐛 Troubleshooting

### Deployment Fails:
- Check FTP credentials in GitHub Secrets
- Verify cPanel File Manager permissions
- Check Actions log for specific errors

### App Won't Start:
- Ensure NodeJS Selector is properly configured
- Check that dependencies were installed via NodeJS Selector
- Verify .env file configuration

Ready to deploy! 🎯
