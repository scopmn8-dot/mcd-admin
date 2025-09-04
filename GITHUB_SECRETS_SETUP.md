# GitHub Secrets Setup for MCD Admin Deployment

## Required GitHub Secrets

To enable automatic deployment, you need to set up the following secrets in your GitHub repository:

### 🔧 **How to Add Secrets**
1. Go to your GitHub repository: `https://github.com/scopmn8-dot/mcd-admin`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each secret below

### 📋 **Required Secrets**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `mcdplan` |
| `GCP_SA_KEY` | Service Account JSON Key (entire JSON content) | `{"type": "service_account",...}` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secure-random-string` |
| `GOOGLE_CLIENT_EMAIL` | Service account email | `mcd-dev@mcdplan.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----\n...` |

### 🔍 **How to Get These Values**

#### 1. **GCP_PROJECT_ID**
```
mcdplan
```

#### 2. **GCP_SA_KEY** 
- Copy the entire content of your `backend/google-credentials.json` file
- This should be the complete JSON object starting with `{"type": "service_account"...}`

#### 3. **JWT_SECRET**
- Generate a secure random string: `openssl rand -hex 32`
- Or use any secure random string for JWT token signing

#### 4. **GOOGLE_CLIENT_EMAIL** 
- From your `google-credentials.json`: look for `"client_email"` field
- Should be: `mcd-dev@mcdplan.iam.gserviceaccount.com`

#### 5. **GOOGLE_PRIVATE_KEY**
- From your `google-credentials.json`: look for `"private_key"` field  
- Include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **Important:** Keep the `\n` characters in the key

### 🚀 **Optional Environment Variables**

These have defaults but can be customized:

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| `GCP_REGION` | `us-central1` | Google Cloud region |
| `CLOUD_RUN_SERVICE` | `mcd-admin-backend` | Cloud Run service name |
| `GAR_IMAGE` | `backend` | Docker image name |

### ⚡ **Quick Setup Script**

Copy your `google-credentials.json` content for the `GCP_SA_KEY` secret:

```bash
# View your service account key (copy this output)
cat backend/google-credentials.json
```

### ✅ **Verify Setup**

After adding all secrets:
1. Push your code to GitHub
2. The workflow should trigger automatically
3. Check the Actions tab for deployment progress

### 🔧 **Current Workflow Status**
- ✅ Fixed authentication issues  
- ✅ Updated to modern Google Auth action
- ✅ Ready for deployment once secrets are configured

The workflow will automatically:
1. Build the Docker image with rate limiting
2. Push to Google Container Registry  
3. Deploy to Cloud Run
4. Update the production backend with quota protection
