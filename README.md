# MCD ADMIN - Miles Car Delivery Administration System

A modern web-based administration system for managing car delivery logistics, clustering jobs, and driver assignments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git (for deployment)

### Development Mode
```bash
# Clone the repository
git clone <your-repository-url>
cd mcd-admin

# Install dependencies and start development servers
./deploy.bat development    # Windows
./deploy.sh development     # Linux/Mac

# Or manually:
# Terminal 1 - Backend
cd backend && npm install && npm start

# Terminal 2 - Frontend  
cd frontend && npm install && npm start
```

### Production Deployment

#### Option 1: Simple Production Build
```bash
# Build and start production server
./deploy.bat production     # Windows
./deploy.sh production      # Linux/Mac
```

#### Option 2: Docker Deployment
```bash
# Start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### Option 3: Cloud Platform (Heroku)
```bash
# Deploy to Heroku
heroku create mcd-admin-app
heroku config:set JWT_SECRET=your-secure-secret
git push heroku main
```

## 🛠️ Configuration

1. Copy `backend/.env.example` to `backend/.env`
2. Update the following variables:
   - `JWT_SECRET`: Secure random string for JWT tokens
   - `PORT`: Server port (default: 3001)
   - `NODE_ENV`: Set to 'production' for production

## 📁 Project Structure
```
mcd-admin/
├── backend/                # Node.js/Express server
│   ├── index.js           # Main server file
│   ├── google-credentials.json # Google Sheets API credentials
│   └── package.json       # Backend dependencies
├── frontend/              # React application
│   ├── src/              # React source code
│   ├── build/            # Production build (created)
│   └── package.json      # Frontend dependencies
├── docker-compose.yml    # Docker deployment configuration
├── deploy.sh/.bat        # Deployment scripts
└── DEPLOYMENT_GUIDE.md   # Detailed deployment guide
```

## 🔧 Features

- **Authentication**: JWT-based user authentication
- **Dashboard**: Real-time logistics overview  
- **Clustering**: Intelligent job clustering algorithms
- **Driver Management**: Driver assignment and routing
- **Google Sheets Integration**: Automated data sync
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Green and black UI theme

## 🌐 Deployment Options

1. **Simple Server**: Single server hosting both frontend and backend
2. **Docker**: Containerized deployment with Docker Compose
3. **Cloud Platforms**: Heroku, Railway, Vercel, AWS, etc.
4. **VPS**: Traditional server deployment with PM2

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📊 System Requirements

**Minimum:**
- RAM: 512MB
- CPU: 1 core
- Storage: 1GB
- Node.js: 18+

**Recommended (Production):**
- RAM: 2GB+
- CPU: 2+ cores  
- Storage: 10GB+
- Load balancer for scaling

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Backup user data and configurations

## 📞 Support

For deployment assistance or issues:
1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review logs for error messages
3. Ensure all prerequisites are installed
4. Verify network connectivity and permissions

## 🏗️ Architecture

```
Internet → Load Balancer → Node.js/Express Server → Google Sheets API
              ↓
          React Frontend (served by Express)
```

**Single Server Mode:**
- Express serves React build files
- All traffic goes through port 3001
- Simpler deployment and management

**Microservices Mode:**
- Frontend and backend deployed separately
- Better scalability
- More complex configuration

Choose based on your needs and infrastructure!
