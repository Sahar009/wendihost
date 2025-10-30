# AWS Amplify Troubleshooting Guide

## Common Error: 500 Internal Server Error

If you're getting 500 errors on Amplify, check these issues:

### 1. Database Connection Issues

**Error:** Cannot connect to PostgreSQL database

**Solutions:**

#### a) Check DATABASE_URL Environment Variable

In Amplify Console → App settings → Environment variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20
```

**Important:** Add connection pooling parameters:
- `connection_limit=10` - Max connections
- `pool_timeout=20` - Timeout in seconds

#### b) Ensure Database is Publicly Accessible

Your PostgreSQL database must be accessible from the internet:
- If using AWS RDS: Check security group allows Amplify IPs
- If using external: Ensure firewall allows connections
- Test connection from local machine with `psql`

#### c) Add PostgreSQL Connection Pool

For AWS RDS, use RDS Proxy or add pooling to connection string:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1
```

### 2. Prisma Client Not Generated

**Error:** Cannot find module '@prisma/client' or Prisma queries fail

**Solutions:**

#### a) Ensure amplify.yml Includes Prisma Generate

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
        - npx prisma generate  # <-- This is critical!
    build:
      commands:
        - npm run build
```

#### b) Check Prisma Binary Targets

In `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

#### c) Add to package.json

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 3. Missing Environment Variables

**Error:** Cannot read property of undefined or environment variable undefined

**Check in Amplify Console:**
- Go to App settings → Environment variables
- Add ALL required variables from `env.example.txt`
- Update `NEXT_PUBLIC_APP_URL` with your Amplify URL

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://...

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com

# Session
IRON_SESSION_SECRET=your_random_secret
SESSION_PASSWORD=your_session_password

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# Add all other variables
```

### 4. Build Failures

**Error:** Build fails or takes too long

**Solutions:**

#### a) Check Build Logs

In Amplify Console → Build settings → Build logs
Look for specific error messages

#### b) Increase Build Timeout

In amplify.yml:
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
    files: ['**/*']
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - .prisma/**/*  # Add Prisma cache
```

#### c) Memory Issues

Add to Environment Variables in Amplify:
```env
NODE_OPTIONS=--max-old-space-size=4096
```

### 5. Cold Start Issues

**Error:** Slow initial page load

**Solutions:**

#### a) Enable Concurrent Builds

In Amplify Console → App settings → Build settings:
- Enable "Concurrent builds"

#### b) Pre-warm Functions

Add health check endpoint that's called periodically
```javascript
// src/pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

#### c) Use Edge Functions (Next.js 13+)

Configure Edge runtime for API routes where possible

### 6. Session/Cookie Issues

**Error:** `SESSION_PASSWORD` not found

**Solutions:**

Add to Amplify Environment Variables:
```env
SESSION_PASSWORD=your_random_secret_string_here
```

Generate a secure random string:
```bash
# Linux/Mac
openssl rand -base64 32

# Or use online generator
```

### 7. getServerSideProps Errors

**Error:** getServerSideProps throws 500 error

**Common Causes:**
1. Database connection fails
2. Missing environment variables
3. Prisma client not initialized

**Debug:**

Add error handling to your getServerSideProps:
```typescript
export const getServerSideProps = async (context) => {
  try {
    // Your existing code
    const reseller = await getResellerInfo(context.req);
    
    return {
      props: {
        reseller
      }
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return {
      props: {
        reseller: null,
        error: error.message
      }
    };
  }
};
```

### 8. Memory/Timeout Issues

**Error:** Function timeout or out of memory

**Solutions:**

#### a) Add Environment Variables
```env
NODE_OPTIONS=--max-old-space-size=4096
AWS_LAMBDA_FUNCTION_TIMEOUT=30
```

#### b) Optimize Queries
- Use `select` instead of returning full objects
- Add indexes to database
- Implement caching

### 9. Image Loading Issues

**Error:** Images not loading from Cloudinary or other domains

**Solutions:**

In `next.config.js`:
```javascript
images: {
  domains: [
    'res.cloudinary.com',
    'your-image-domain.com'
  ],
}
```

## Debugging Steps

### Step 1: Check Build Logs

1. Go to Amplify Console
2. Click on your app
3. Click "Build history"
4. Click on latest build
5. Review logs for errors

### Step 2: Check Runtime Logs

1. Go to Amplify Console
2. Monitoring → Logs
3. Look for error messages

### Step 3: Test Database Connection

Create a test API endpoint:
```typescript
// src/pages/api/test-db.ts
import prisma from '@/libs/prisma';

export default async function handler(req, res) {
  try {
    const count = await prisma.user.count();
    res.status(200).json({ 
      success: true, 
      userCount: count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

Visit: `https://your-amplify-url/api/test-db`

### Step 4: Test Prisma Client

Visit: `https://your-amplify-url/api/debug-prisma`

This will show if Prisma is configured correctly.

## Environment Variables Checklist

Verify these are ALL set in Amplify Console:

```env
# ✅ Database
DATABASE_URL=postgresql://...

# ✅ App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com

# ✅ Session
IRON_SESSION_SECRET=...
SESSION_PASSWORD=...

# ✅ Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# ✅ Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# ✅ Add all other variables from env.example.txt
```

## Quick Fixes for 500 Error

1. **Check DATABASE_URL** - Most common cause
2. **Verify Prisma generates** - Add to amplify.yml
3. **Check environment variables** - All required vars set
4. **Check build logs** - Look for specific errors
5. **Test database connection** - Use test-db API
6. **Review runtime logs** - Check Amplify monitoring

## Still Not Working?

1. Check Amplify build logs for specific error
2. Review CloudWatch logs
3. Test locally first with `npm run build && npm run start`
4. Verify all environment variables are set
5. Check database is accessible from internet
6. Ensure Prisma client is being generated

## Contact Support

If none of these work:
- AWS Amplify Support: https://aws.amazon.com/amplify/
- Next.js Discord: https://discord.gg/nextjs
- Prisma Discord: https://pris.ly/discord

