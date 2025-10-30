# AWS Amplify Deployment Guide

This guide will help you deploy your Next.js application to AWS Amplify.

## Important Differences from EC2

AWS Amplify is **NOT** the same as EC2:
- ❌ **No custom server.js** - Amplify uses standard Next.js serverless functions
- ❌ **No PM2** - Amplify manages processes automatically
- ✅ **Auto-scaling** - Serverless, scales automatically
- ✅ **Built-in CI/CD** - Automatic deployments from Git
- ✅ **Free SSL** - Automatically provided
- ✅ **Simpler** - Less configuration needed

## Pre-Deployment Requirements

### 1. Database Considerations

**⚠️ CRITICAL:** Amplify uses serverless functions that have cold starts. Your database connection needs special handling:

- [ ] PostgreSQL database accessible from internet (RDS recommended)
- [ ] Connection pooling configured (Prisma has this built-in)
- [ ] Environment variables for database

### 2. Prisma on Amplify

Prisma works with Amplify, but requires special build configuration:

- [ ] Prisma Client is generated during build
- [ ] Need to ensure `npx prisma generate` runs
- [ ] Binary targets may need configuration

### 3. Amplify Account Setup

- [ ] AWS Account created
- [ ] AWS Amplify Console access
- [ ] Git repository (GitHub, Bitbucket, or GitLab)
- [ ] Domain name (optional)

---

## Step 1: Amplify Console Setup

### 1.1 Connect Repository

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app" → "Host web app"**
3. Choose your Git provider (GitHub, Bitbucket, GitLab, or CodeCommit)
4. Authorize AWS Amplify access to your repository
5. Select your repository: `wendihost`
6. Select branch: `main` (or your deployment branch)
7. Click **"Next"**

### 1.2 Build Settings

AWS Amplify should auto-detect Next.js. Verify these settings:

**Build image**: Amazon Linux 2 or Ubuntu 22

**Build settings** (amplify.yml):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## Step 2: Configure Environment Variables

In Amplify Console → App settings → Environment variables, add:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-amplify-domain.amplifyapp.com

# Prisma
SKIP_POSTINSTALL_GENERATE=0
```

### Add Your Other Variables

From `env.example.txt`, add:
- Firebase credentials
- Cloudinary settings
- API keys
- Session secrets
- etc.

**Important Notes:**
- ⚠️ Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- 🔒 Keep secrets in environment variables, not in code
- 📝 Update `NEXT_PUBLIC_APP_URL` after deployment

---

## Step 3: Build Configuration

### Option A: Use Default (Recommended)

Amplify auto-detects Next.js and configures build correctly.

### Option B: Custom amplify.yml

Create `amplify.yml` in your project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        # Install dependencies
        - echo "Installing dependencies..."
        - npm install
        
        # Generate Prisma Client
        - echo "Generating Prisma Client..."
        - npx prisma generate
    
    build:
      commands:
        # Build Next.js application
        - echo "Building Next.js application..."
        - npm run build
  
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - .prisma/**/*
```

---

## Step 4: Configure Prisma for Amplify

### Update prisma/schema.prisma

Add binary targets for AWS Lambda:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Or for broader compatibility:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

### Update package.json

Add postinstall script to ensure Prisma generates:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## Step 5: Deploy

### 5.1 Initial Deployment

1. Click **"Save and deploy"** in Amplify Console
2. Wait for build to complete (5-15 minutes)
3. Monitor build logs in real-time
4. Address any errors

### 5.2 Verify Deployment

1. Amplify will provide a URL: `https://main.xxxxx.amplifyapp.com`
2. Visit the URL
3. Test key features:
   - Homepage loads
   - Authentication works
   - Database connections work
   - API routes respond

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain

1. In Amplify Console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow DNS setup instructions

### 6.2 Configure DNS

Add CNAME record to your DNS:

```
Type: CNAME
Name: @ or www
Value: [Your Amplify domain].amplifyapp.com
```

Wait for DNS propagation (15-60 minutes).

---

## Step 7: Post-Deployment Configuration

### 7.1 Update Environment Variables

After getting your Amplify URL, update:

```env
NEXT_PUBLIC_APP_URL=https://your-actual-amplify-url.amplifyapp.com
```

Redeploy to apply changes.

### 7.2 Database Security

If using AWS RDS:

1. Update RDS security group
2. Allow connections from Amplify IPs (check Amplify docs)
3. Or use RDS Proxy for better connection management

---

## Step 8: Continuous Deployment

### Automatic Deployments

Amplify auto-deploys on:
- Push to main branch
- Pull requests (preview deployments)

### Manual Redeploy

1. Go to Amplify Console
2. Click **"Redeploy this version"**
3. Or trigger from GitHub

---

## Troubleshooting

### Build Failures

**Error: "Cannot find module '@prisma/client'"**

**Solution:** Ensure Prisma generates during build:
```yaml
preBuild:
  commands:
    - npx prisma generate
```

**Error: "Connection refused to database"**

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check RDS security group allows Amplify IPs
3. Ensure database is publicly accessible
4. Check firewall rules

**Error: "Page not found" or routing issues**

**Solution:** Ensure you're using Next.js 13+ and the correct `start` command:
```json
"start": "next start"
```

### Runtime Errors

**Error: "Function timeout"**

**Solution:** 
- Optimize your API routes
- Add caching where possible
- Use connection pooling for database

**Error: "Out of memory"**

**Solution:**
- Reduce bundle size
- Optimize images
- Check for memory leaks in API routes

### Cold Start Issues

If experiencing slow initial loads:

1. Enable **"Concurrent builds"** in Amplify settings
2. Use **Edge Functions** for faster starts (Next.js 13+)
3. Implement proper caching
4. Pre-warm functions (external service)

---

## Environment Variables Reference

### Required for Amplify

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.amplifyapp.com

# Build
SKIP_POSTINSTALL_GENERATE=0
NODE_OPTIONS=--max-old-space-size=4096
```

### Common Variables

```env
# Prisma
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# Session
IRON_SESSION_SECRET=...

# Add your other variables...
```

---

## Monitoring and Logs

### View Logs

1. Amplify Console → **"Monitoring"**
2. View real-time logs
3. Check CloudWatch logs for detailed errors

### Performance Monitoring

- CloudWatch Metrics for function performance
- Real User Monitoring (RUM) in Amplify
- Custom analytics integration

---

## Cost Estimation

### AWS Amplify Pricing

- **Hosting:** $15/month for 5 GB storage + 15 GB data transfer
- **Builds:** $0.01 per build minute
- **Additional bandwidth:** $0.15/GB

**Typical monthly cost:** $20-50

### Free Tier

- 15 build minutes/month free
- 5 GB storage free
- 15 GB data transfer free

---

## Key Differences from EC2 Setup

| Feature | AWS Amplify | EC2 |
|---------|-------------|-----|
| Server | Serverless | Dedicated server |
| Scaling | Automatic | Manual |
| Custom server.js | ❌ Not supported | ✅ Supported |
| PM2 | ❌ Not needed | ✅ Required |
| SSL | ✅ Automatic | Manual (Let's Encrypt) |
| Deployment | ✅ Git push | SSH + manual |
| Cost | $20-50/month | $15-50/month |
| Cold starts | ⚠️ Possible | ❌ None |
| Control | Limited | Full control |

---

## Amplify vs EC2: Which to Use?

### Use AWS Amplify if:
- ✅ Want simplest deployment
- ✅ Automatic scaling needed
- ✅ Don't need custom server configuration
- ✅ OK with serverless architecture
- ✅ Want Git-based CI/CD

### Use AWS EC2 if:
- ✅ Need full server control
- ✅ Want to use custom server.js
- ✅ Need specific server configurations
- ✅ Want to avoid cold starts
- ✅ Need PM2 or custom process management

---

## Migration from EC2 to Amplify

If you're moving from EC2:

1. ✅ **Already done:** Changed `start` script to `next start`
2. ❌ **Not needed:** Remove `ecosystem.config.js`
3. ⚠️ **May need:** Adjust Prisma binary targets
4. ⚠️ **Review:** API routes for serverless compatibility
5. ✅ **Use:** Amplify's environment variable management

---

## Files NOT Needed for Amplify

These files are EC2-specific and not needed:

- ❌ `ecosystem.config.js` - PM2 config (not needed)
- ❌ `server.js` - Custom server (not supported)
- ❌ `AWS_EC2_DEPLOYMENT.md` - Wrong guide
- ❌ `AWS_QUICK_START.md` - Wrong guide

Files you DO need:

- ✅ `package.json` - Dependencies
- ✅ `next.config.js` - Next.js config
- ✅ `prisma/` - Database schema
- ✅ Environment variables in Amplify Console

---

## Next Steps

1. ✅ **Changed:** `start` script to `next start`
2. ⬜ **Review:** Prisma binary targets
3. ⬜ **Create:** amplify.yml (if needed)
4. ⬜ **Setup:** Amplify Console
5. ⬜ **Configure:** Environment variables
6. ⬜ **Deploy:** First deployment
7. ⬜ **Test:** All features
8. ⬜ **Configure:** Custom domain
9. ⬜ **Monitor:** Performance and logs

---

## Quick Start

1. Go to AWS Amplify Console
2. Connect your Git repository
3. Configure build settings
4. Add environment variables
5. Deploy!
6. Test and enjoy

**Total time:** ~30 minutes

---

## Support

- AWS Amplify Docs: https://docs.aws.amazon.com/amplify/
- Next.js Amplify Guide: https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/
- Prisma on AWS Lambda: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda

---

**Good luck with your Amplify deployment! 🚀**

