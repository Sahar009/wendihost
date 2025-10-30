# AWS Amplify 500 Error - Fix Summary

## 🔴 Current Issue

Your Amplify deployment is showing **500 Internal Server Error** on `/auth/login`.

## ✅ Changes Made

### 1. **src/libs/prisma.ts** (UPDATED)
- Added logging configuration for production
- Added graceful shutdown handling
- Improved error handling for serverless environments

### 2. **AMPLIFY_TROUBLESHOOTING.md** (NEW)
- Complete troubleshooting guide
- Common issues and solutions
- Debugging steps

---

## 🚨 Most Likely Causes of Your 500 Error

### 1. **DATABASE_URL Missing or Incorrect** (90% likely)
**Check:** AWS Amplify Console → Environment Variables

You need to add:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 2. **Prisma Client Not Generating** (70% likely)
**Check:** amplify.yml should include:
```yaml
preBuild:
  commands:
    - npx prisma generate
```

### 3. **Missing SESSION_PASSWORD** (50% likely)
**Check:** Add to Environment Variables:
```env
SESSION_PASSWORD=your_random_secret_string
```

### 4. **Database Not Accessible** (40% likely)
**Check:** Your PostgreSQL must be accessible from the internet

---

## 📋 Immediate Action Items

### Step 1: Check Environment Variables

Go to AWS Amplify Console → Your App → Environment variables

**Verify these are set:**
- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `SESSION_PASSWORD` - Random secret string
- ✅ `IRON_SESSION_SECRET` - Random secret string
- ✅ `NODE_ENV=production`
- ✅ `NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com`
- ✅ All Firebase variables (`NEXT_PUBLIC_FIREBASE_*`)
- ✅ All Cloudinary variables

### Step 2: Verify amplify.yml

Create or check `amplify.yml` in your project root:

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

### Step 3: Redeploy

After adding/changing environment variables:

1. Go to Amplify Console
2. Click "Redeploy this version" 
3. OR push a commit to trigger rebuild

### Step 4: Check Build Logs

1. Go to Amplify Console
2. Click "Build history"
3. View latest build logs
4. Look for error messages

---

## 🧪 Debug Your Deployment

### Test Database Connection

Create `src/pages/api/test-db.ts`:

```typescript
import prisma from '@/libs/prisma';

export default async function handler(req: any, res: any) {
  try {
    const count = await prisma.user.count();
    res.status(200).json({ 
      success: true, 
      count 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}
```

Deploy and visit: `https://main.d1g7n7qzu0zuv4.amplifyapp.com/api/test-db`

This will tell you if database connection works.

---

## 🔍 What to Check in Amplify Console

### 1. Environment Variables
**Path:** App settings → Environment variables

**Must include:**
- DATABASE_URL
- SESSION_PASSWORD
- IRON_SESSION_SECRET
- NEXT_PUBLIC_APP_URL
- All other env vars

### 2. Build Settings
**Path:** App settings → Build settings

**Check:**
- amplify.yml exists
- preBuild includes `npx prisma generate`
- build includes `npm run build`

### 3. Build Logs
**Path:** Build history → Latest build

**Look for:**
- ❌ "Cannot find module '@prisma/client'"
- ❌ "DATABASE_URL" undefined
- ❌ Prisma errors
- ❌ Build failures

### 4. Runtime Logs
**Path:** Monitoring → Logs

**Look for:**
- Error messages
- Stack traces
- Database connection errors

---

## 🔧 Quick Fixes

### Fix 1: Add Missing Environment Variables

Go to Amplify Console → Environment variables → Add:

```env
DATABASE_URL=postgresql://user:password@host:5432/db
SESSION_PASSWORD=generate-random-string-here
IRON_SESSION_SECRET=generate-random-string-here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

### Fix 2: Add amplify.yml

Create `amplify.yml` in project root:

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
```

Commit and push:
```bash
git add amplify.yml
git commit -m "Add Amplify build config"
git push
```

### Fix 3: Check Database Access

Test connection:
```bash
psql "postgresql://user:password@host:5432/db"
```

If it connects locally, database is accessible.

### Fix 4: Redeploy

After making changes:
1. Amplify Console → Redeploy
2. Wait for build to complete
3. Test login page

---

## 📊 Testing Checklist

- [ ] Build completes successfully
- [ ] DATABASE_URL is set correctly
- [ ] Prisma generates in build logs
- [ ] /api/test-db returns success
- [ ] /auth/login page loads
- [ ] No 500 errors in logs

---

## 🆘 Still Getting 500?

### Debug Steps:

1. **Check build logs** - What error appears?
2. **Check runtime logs** - What's in CloudWatch?
3. **Test /api/test-db** - Does database connect?
4. **Test /api/debug-prisma** - Is Prisma working?
5. **Review AMPLIFY_TROUBLESHOOTING.md** - Full guide

### Common Final Issues:

**"Prisma binary not found"**
- Solution: Check binary targets in schema.prisma

**"Cannot read property of undefined"**
- Solution: Missing environment variable

**"Database connection refused"**
- Solution: Database not publicly accessible

**"Session password required"**
- Solution: Add SESSION_PASSWORD to env vars

---

## 📝 Summary

Your 500 error is most likely due to:

1. ❌ **Missing DATABASE_URL** environment variable
2. ❌ **Prisma not generating** during build
3. ❌ **Missing SESSION_PASSWORD** for sessions
4. ❌ **Database not accessible** from internet

**Fix order:**
1. Add all environment variables
2. Create/verify amplify.yml
3. Redeploy
4. Test /api/test-db
5. Check logs for specific errors

---

## 📚 Resources

- **Full Troubleshooting:** See `AMPLIFY_TROUBLESHOOTING.md`
- **Deployment Guide:** See `AWS_AMPLIFY_DEPLOYMENT.md`
- **Amplify Docs:** https://docs.aws.amazon.com/amplify/

---

**Next Step:** Go to Amplify Console and check your environment variables!

