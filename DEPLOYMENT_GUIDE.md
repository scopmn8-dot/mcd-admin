# MCD ADMIN Deployment Guide

## Overview
The MCD ADMIN system consists of two parts:
1. **Backend**: Node.js/Express server (currently on port 3001)
2. **Frontend**: React application (currently on port 3001 in dev mode)

## Deployment Options

### 1. 🚀 Simple Production Build (Recommended for Quick Start)

#### Step 1: Build the Frontend for Production
```bash
cd frontend
npm run build
```
This creates an optimized `build` folder with static files.

#### Step 2: Configure Backend to Serve Frontend
The backend can serve the React build files. Add this to your `backend/index.js`:

```javascript
// Serve React app (add this after other routes)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
```

#### Step 3: Update Package.json Scripts
Add deployment scripts to `backend/package.json`:
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "cd ../frontend && npm run build",
    "deploy": "npm run build && npm start"
  }
}
```

#### Step 4: Set Production Environment Variables
Create `backend/.env`:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-here
```

#### Step 5: Start Production Server
```bash
cd backend
npm run deploy
```

### 2. 🐳 Docker Deployment (Recommended for Production)

#### Create Dockerfile for Backend
Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Copy frontend build
COPY ../frontend/build ./public

EXPOSE 3001

CMD ["node", "index.js"]
```

#### Create Dockerfile for Frontend
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create docker-compose.yml
Create `docker-compose.yml` in root directory:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-super-secure-jwt-secret
    volumes:
      - ./backend/google-credentials.json:/app/google-credentials.json
      - ./backend/users.json:/app/users.json
      - ./backend/processed-jobs.json:/app/processed-jobs.json
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### Deploy with Docker
```bash
docker-compose up -d
```

### 3. ☁️ Cloud Platform Deployment

#### A. Heroku Deployment
1. **Prepare for Heroku**:
```bash
# Install Heroku CLI
# Create Procfile in root:
echo "web: cd backend && npm start" > Procfile

# Create package.json in root:
```
```json
{
  "name": "mcd-admin",
  "version": "1.0.0",
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "start": "cd backend && npm start",
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

2. **Deploy**:
```bash
heroku create mcd-admin-app
heroku config:set JWT_SECRET=your-super-secure-jwt-secret
git add .
git commit -m "Deploy MCD ADMIN"
git push heroku main
```

#### B. Vercel Deployment (Frontend only)
```bash
cd frontend
npm install -g vercel
vercel
```

#### C. Railway Deployment
1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy automatically

### 4. 🖥️ VPS/Server Deployment

#### Requirements
- Ubuntu/CentOS server
- Node.js 18+
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

#### Setup Steps
```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
npm install -g pm2

# 3. Clone your code
git clone <your-repository>
cd mcd-admin

# 4. Install dependencies
cd backend && npm install
cd ../frontend && npm install && npm run build

# 5. Configure PM2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'mcd-admin-backend',
    script: './backend/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      JWT_SECRET: 'your-super-secure-jwt-secret'
    }
  }]
};
```

```bash
# 6. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx Configuration (Optional)
Create `/etc/nginx/sites-available/mcd-admin`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 📱 Mobile/PWA Considerations

#### Make it a PWA
Add to `frontend/public/manifest.json`:
```json
{
  "short_name": "MCD Admin",
  "name": "Miles Car Delivery Administration",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#00ff88",
  "background_color": "#0a0a0a"
}
```

## Pre-Deployment Checklist

### Security
- [ ] Change JWT_SECRET to a secure random string
- [ ] Update Google Sheets credentials
- [ ] Enable CORS properly for your domain
- [ ] Add rate limiting
- [ ] Use HTTPS in production

### Configuration
- [ ] Update API URLs in frontend for production
- [ ] Set proper environment variables
- [ ] Configure database connections
- [ ] Set up backup strategies

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Optimize images and assets
- [ ] Enable caching headers

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Performance monitoring

## Quick Start Command Summary

```bash
# For simple deployment:
cd frontend && npm run build
cd ../backend && npm start

# For Docker:
docker-compose up -d

# For development:
# Terminal 1: cd backend && npm start
# Terminal 2: cd frontend && npm start
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NODE_ENV | Environment | No | development |
| PORT | Server port | No | 3001 |
| JWT_SECRET | JWT signing key | Yes | - |
| CORS_ORIGIN | Allowed origins | No | * |

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change PORT in environment
2. **CORS errors**: Update CORS configuration
3. **Build failures**: Check Node.js version compatibility
4. **Google Sheets auth**: Verify credentials file path

### Logs
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# Direct logs
cd backend && npm start
```

Choose the deployment method that best fits your infrastructure and requirements!
