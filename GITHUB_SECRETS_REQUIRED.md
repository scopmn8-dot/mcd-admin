# GitHub Secrets Required for Deployment

Your GitHub repository needs these secrets configured for the deployment to work. The "Invalid JWT Signature" error indicates these are not set up.

## Required Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### 1. GCP_PROJECT_ID
- **Name**: `GCP_PROJECT_ID`
- **Value**: `mcdplan`

### 2. GCP_SA_KEY
This is your Google Cloud Service Account JSON key. You need to:

1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Find the service account: `mcd-dev@mcdplan.iam.gserviceaccount.com`
3. Click on it → Keys tab → Add Key → Create new key → JSON
4. Download the JSON file
5. Copy the ENTIRE contents of the JSON file (including the outer {})

The JSON should look like:
```json
{
  "type": "service_account",
  "project_id": "mcdplan",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "mcd-dev@mcdplan.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 3. JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: A secure random string (at least 32 characters)
- **Example**: `your-super-secret-jwt-key-here-make-it-long-and-random`

## How to Add Secrets

1. Go to: https://github.com/scopmn8-dot/mcd-admin/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret above
4. After adding all secrets, go to the Actions tab and re-run the failed deployment

## Verify Setup

Once secrets are added, you can test the deployment by:

1. Visit: https://mcd-admin-backend-98971900308.us-central1.run.app/api/health
2. Check that credentials.source shows "environment_variables" instead of "file"
3. Visit: https://mcd-admin-backend-98971900308.us-central1.run.app/api/test-sheets
4. This should show Google Sheets connection success

## Common Issues

- **"Invalid JWT Signature"**: Missing or incorrect GCP_SA_KEY
- **"No project specified"**: Missing GCP_PROJECT_ID
- **Authentication failed**: JWT_SECRET not set or too short

After setting up these secrets, the GitHub Action will deploy with proper environment variables and authentication should work.
