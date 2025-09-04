## Quick Setup - Copy These Values to GitHub Secrets

### 🎯 **Your Exact Secret Values:**

**GCP_PROJECT_ID:**
```
mcdplan
```

**GOOGLE_CLIENT_EMAIL:**
```
mcd-dev@mcdplan.iam.gserviceaccount.com
```

**GCP_SA_KEY:** (Copy the ENTIRE google-credentials.json content)
```json
{
  "type": "service_account",
  "project_id": "mcdplan",
  "private_key_id": "7f3b25e1b6ae8b2edd24e4bfd7c47649a0d0cfa4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDeLaxZqmOF0IpU\nsXwJAHgmd+3jPcaHicSS+mjxCtoVrHxl0W/dAVesmy8Y+HYhcdurD/9pCQVKv6KR\n7kBwaxKh+6WW/Yfx5DG0IDqHYMTTGSs3WzRFawnzY3mgHiVeFswf4C4EdDje+8DV\nusIg81EkJTjfcGDgnXCcnCg9yoBZedOUApAYUBoJwcCozDKQzBYLg9P2fA+zFwaZ\noiFpbTiAKeXF1sR3hTZTSM9GV8u4CqY4dl9JW4Xxp+MCMbFYVljJ1Sp3dnexNhd/\n9ogMT++QZGGOed3agrZWom9IDdZVQ6WaLPPTWr2b4ttHSVUPu6Hq1+SdZjzpXg/+\nfAOuL4VzAgMBAAECggEAS09TAO/DHVwzT4L7xrdcgrmbLrBFZ7L4qVNtF+t0Qe1+\nGyszTkgCtnTBsaaisDJ+Yc0h57IRk6VCj1GhkRmSLsr0dapJluIhQOu9ux6/iMia\nwABPxwoBzPjWhMJDK1Hx7goYvxTAJEFUu327CN1BD034qbBXfjuPrN43u7405F7H\nmD23Sil9YhgMbVlj/zYKamQzflPtfA4ioeHDAW/XimjYJNtJn96kH4QC5000TDgG\n8Blkwzl2grTYKwfSCElO2o+4PRicpat/2qHjjU+m09k3gLJUMosRg9kB0X2wO8yI\nAC8qk5l5mvhbFEFSTNK4BAraV05V3dVS3FLtRIqalQKBgQD/v7EUJzDN55yvNl9c\n3tJjtQEFKXpw0O6dnMa39KKYIu2F+2L3w57vUKh+fmsynXppPhOernskbd8JHTMP\ng00SlHRMuIhjdr2YdXWDiLnut5I70ILzEyZHVlnlxHScjtNqxjxaf6VywKu9gT6T\niPlF3W7nEkvcSajB6ZAgwWaLPQKBgQDeZYpMERqZ0NOR9UVSGfeyHS73W/Tt2hQB\nM8yKoDLMRIwHCVELHuWXf3PkNa7wDxxPh780jWnyLe6yip4nB/ljBSBkRf44qf+R\nnzlmSvpKE4SUwPftOqTm0TC0H8QZILbiwktvE7EVcu3kZ+Rc9GppBQclrf1r4Ab6\nqdwwjogebwKBgHk2DCJGFM5yCIPOXFIy1Tombm5Y40wW6hDPXiuPiYRbgYGvzI8r\nKue3rbQODJZ3pq28myXpAjoYzM2QBkRC8cNtktVN3G5vt5pLiT+nDKCEZo1s3LOC\nDvFejsrkWnRdCPyhKbemqe6CPKNbXyIjmCkxsr9Xn5avXolRPlsX7pbtAoGAKEpb\nCLbci9tCSSIXQe2Ea1dQJ+4X7HNixmj8+GxXZ5xPhgLRFOOvEog7la+IFuOV7G6a\nXEn2VLKvmNb2Gfoe2yqVmLT5foiFzXr8KiURPRRWI6DmCatjLpHdcfSDUU4U8/Xh\nNqlpnooowQV1YMXC9W28wr3HuKBog0b8pitcS68CgYEA8bQ9IjihpjEE8qZc/OZa\nl6L3dzjVGuivKIWivBP5gAJ8avVEjlYaII5miLl5nDeTs7Ll9HNFCwBFYx4+KQFS\nYG7c2jSZD0TvFdTtA/HGZZ0mQ8RX2s8r9qdxG3oTEMjXFDupV9W2CIHqTyKxSAax\nHgzlLl+HefcyGHQZ0AoMBrM=\n-----END PRIVATE KEY-----\n",
  "client_email": "mcd-dev@mcdplan.iam.gserviceaccount.com",
  "client_id": "101648312490421881562",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "universe_domain": "googleapis.com"
}
```

**GOOGLE_PRIVATE_KEY:** (Extract just the private_key field - KEEP the \n characters)
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDeLaxZqmOF0IpU\nsXwJAHgmd+3jPcaHicSS+mjxCtoVrHxl0W/dAVesmy8Y+HYhcdurD/9pCQVKv6KR\n7kBwaxKh+6WW/Yfx5DG0IDqHYMTTGSs3WzRFawnzY3mgHiVeFswf4C4EdDje+8DV\nusIg81EkJTjfcGDgnXCcnCg9yoBZedOUApAYUBoJwcCozDKQzBYLg9P2fA+zFwaZ\noiFpbTiAKeXF1sR3hTZTSM9GV8u4CqY4dl9JW4Xxp+MCMbFYVljJ1Sp3dnexNhd/\n9ogMT++QZGGOed3agrZWom9IDdZVQ6WaLPPTWr2b4ttHSVUPu6Hq1+SdZjzpXg/+\nfAOuL4VzAgMBAAECggEAS09TAO/DHVwzT4L7xrdcgrmbLrBFZ7L4qVNtF+t0Qe1+\nGyszTkgCtnTBsaaisDJ+Yc0h57IRk6VCj1GhkRmSLsr0dapJluIhQOu9ux6/iMia\nwABPxwoBzPjWhMJDK1Hx7goYvxTAJEFUu327CN1BD034qbBXfjuPrN43u7405F7H\nmD23Sil9YhgMbVlj/zYKamQzflPtfA4ioeHDAW/XimjYJNtJn96kH4QC5000TDgG\n8Blkwzl2grTYKwfSCElO2o+4PRicpat/2qHjjU+m09k3gLJUMosRg9kB0X2wO8yI\nAC8qk5l5mvhbFEFSTNK4BAraV05V3dVS3FLtRIqalQKBgQD/v7EUJzDN55yvNl9c\n3tJjtQEFKXpw0O6dnMa39KKYIu2F+2L3w57vUKh+fmsynXppPhOernskbd8JHTMP\ng00SlHRMuIhjdr2YdXWDiLnut5I70ILzEyZHVlnlxHScjtNqxjxaf6VywKu9gT6T\niPlF3W7nEkvcSajB6ZAgwWaLPQKBgQDeZYpMERqZ0NOR9UVSGfeyHS73W/Tt2hQB\nM8yKoDLMRIwHCVELHuWXf3PkNa7wDxxPh780jWnyLe6yip4nB/ljBSBkRf44qf+R\nnzlmSvpKE4SUwPftOqTm0TC0H8QZILbiwktvE7EVcu3kZ+Rc9GppBQclrf1r4Ab6\nqdwwjogebwKBgHk2DCJGFM5yCIPOXFIy1Tombm5Y40wW6hDPXiuPiYRbgYGvzI8r\nKue3rbQODJZ3pq28myXpAjoYzM2QBkRC8cNtktVN3G5vt5pLiT+nDKCEZo1s3LOC\nDvFejsrkWnRdCPyhKbemqe6CPKNbXyIjmCkxsr9Xn5avXolRPlsX7pbtAoGAKEpb\nCLbci9tCSSIXQe2Ea1dQJ+4X7HNixmj8+GxXZ5xPhgLRFOOvEog7la+IFuOV7G6a\nXEn2VLKvmNb2Gfoe2yqVmLT5foiFzXr8KiURPRRWI6DmCatjLpHdcfSDUU4U8/Xh\nNqlpnooowQV1YMXC9W28wr3HuKBog0b8pitcS68CgYEA8bQ9IjihpjEE8qZc/OZa\nl6L3dzjVGuivKIWivBP5gAJ8avVEjlYaII5miLl5nDeTs7Ll9HNFCwBFYx4+KQFS\nYG7c2jSZD0TvFdTtA/HGZZ0mQ8RX2s8r9qdxG3oTEMjXFDupV9W2CIHqTyKxSAax\nHgzlLl+HefcyGHQZ0AoMBrM=\n-----END PRIVATE KEY-----
```

**⚠️ Important:** When copying this private key to GitHub secrets, use the exact value from your `google-credentials.json` file's `"private_key"` field. It should include the `\n` characters as literal text (not actual newlines).

**JWT_SECRET:** (Generate a new one or use this example)
```
your-secure-jwt-secret-key-here-make-it-long-and-random
```

### 🚀 **Steps to Deploy:**

1. **Go to GitHub:** https://github.com/scopmn8-dot/mcd-admin/settings/secrets/actions
2. **Add each secret** using the values above
3. **Push any change to trigger deployment** or go to Actions tab and manually trigger
4. **Monitor deployment** in the Actions tab

The deployment will automatically build and deploy your rate-limited backend to Google Cloud Run!
