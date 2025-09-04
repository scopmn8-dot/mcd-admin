@echo off
echo ================================
echo   MCD Admin Backend Deployment
echo ================================

echo Step 1: Enabling APIs...
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com

echo Step 2: Creating Artifact Registry repository...
gcloud artifacts repositories create mcd-admin --repository-format=docker --location=us-central1 --description="MCD Admin Docker images"

echo Step 3: Building Docker image...
cd backend
docker build -t us-central1-docker.pkg.dev/mcdplan/mcd-admin/backend:latest .

echo Step 4: Pushing to Artifact Registry...
docker push us-central1-docker.pkg.dev/mcdplan/mcd-admin/backend:latest

echo Step 5: Deploying to Cloud Run...
gcloud run deploy mcd-admin-backend --image us-central1-docker.pkg.dev/mcdplan/mcd-admin/backend:latest --region us-central1 --platform managed --allow-unauthenticated --port 3001 --set-env-vars NODE_ENV=production,JWT_SECRET=1f89b390a96c70f91ce94b2a803e6302bf441670ad8696fbc2eddb49b5cd06bdcc2fe50772111c7637c34e547d07bd6507deb651bdc286b2dd500921dcd3a898,GOOGLE_CLIENT_EMAIL=mcd-dev@mcdplan.iam.gserviceaccount.com,CORS_ORIGIN=https://scopmn8-dot.github.io

echo ================================
echo   Deployment Complete!
echo ================================
echo The service URL will be displayed above.
pause
