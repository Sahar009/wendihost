# Debug 500 Error on AWS Amplify

## Your Current Error

**URL:** https://main.d1g7n7qzu0zuv4.amplifyapp.com/auth/login  
**Error:** 500 Internal Server Error

---

## ✅ Files Fixed

### 1. Created `amplify.yml`
- Ensures Prisma generates during build
- Proper build configuration for Amplify

### 2. Updated `src/libs/prisma.ts`
- Added better error handling
- Added logging for debugging
- Configured for serverless environments

### 3. Created Debug Guides
- `AMPLIFY_TROUBLESHOOTING.md` - Full troubleshooting
- `AMPLIFY_FIX_SUMMARY.md` - Quick fixes
- `DEBUG_500_ERROR.md` - This file

---

## 🚨 Immediate Steps to Fix

### Step 1: Push Changes to Git

```bash
git add amplify.yml src/libs/prisma.ts
git commit -m "Fix Amplify deployment: Add amplify.yml and improve Prisma config"
git push
```

### Step 2: Check Environment Variables in Amplify

Go to AWS Amplify Console → Your App → Environment variables

**You MUST have these:**

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_PASSWORD=your_random_secret_here
IRON_SESSION_SECRET=your_random_secret_here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com
```

**Generate random secrets:**
```bash
# Run this command twice to generate 2 different secrets:
openssl rand -base64 32
```

### Step 3: Add All Other Environment Variables

Check `env.example.txt` and add ALL variables to Amplify Console.

**Required:**
- Firebase variables (NEXT_PUBLIC_FIREBASE_*)
- Cloudinary variables (NEXT_PUBLIC_CLOUDINARY_*)
- Any other API keys

### Step 4: Redeploy

After adding environment variables:
1. Go to Amplify Console
2. Click "Redeploy this version"
3. Wait for build to complete (5-15 minutes)
4. Check build logs for errors

### Step 5: Test

Visit: https://main.d1g7n7qzu0zuv4.amplifyapp.com/auth/login

Should work now!

---

## 🔍 If Still Getting 500 Error

### Check Build Logs

1. Amplify Console → Build history
2. Click latest build
3. Look for error messages

**Common errors:**

**"Cannot find module '@prisma/client'"**
```
Solution: Ensure npx prisma generate is in amplify.yml (✅ Already added)
```

**"DATABASE_URL environment variable is not set"**
```
Solution: Add DATABASE_URL to Amplify environment variables
```

**"Cannot connect to database"**
```
Solution: Check database is publicly accessible, verify connection string
```

### Check Runtime Logs

1. Amplify Console → Monitoring → Logs
2. Look for error messages

### Test Database Connection

Create test endpoint: `src/pages/api/test-db.ts`

```typescript
import prisma from '@/libs/prisma';

export default async function handler(req: any, res: any) {
  try {
    const count = await prisma.user.count();
    res.status(200).json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

Push and test: https://main.d1g7n7qzu0zuv4.amplifyapp.com/api/test-db

---

## 📋 Checklist

- [ ] Pushed `amplify.yml` to Git
- [ ] Added `DATABASE_URL` to Amplify environment variables
- [ ] Added `SESSION_PASSWORD` to environment variables
- [ ] Added `IRON_SESSION_SECRET` to environment variables
- [ ] Added all Firebase variables
- [ ] Added all Cloudinary variables
- [ ] Added `NEXT_PUBLIC_APP_URL`
- [ ] Redeployed application
- [ ] Checked build logs (no errors)
- [ ] Tested /auth/login page
- [ ] Tested /api/test-db endpoint

---

## 🎯 Most Likely Issue

Based on your error, the most common cause is:

**Missing `DATABASE_URL` environment variable**

This causes Prisma to fail, which causes getServerSideProps to fail, which causes 500 error.

**Fix:** Add DATABASE_URL in Amplify Console.

---

## 📚 More Help

- **Full troubleshooting:** `AMPLIFY_TROUBLESHOOTING.md`
- **Quick fixes:** `AMPLIFY_FIX_SUMMARY.md`
- **Deployment guide:** `AWS_AMPLIFY_DEPLOYMENT.md`

---

## 🚀 Summary

**What you need to do NOW:**

1. Push the `amplify.yml` file (already created)
2. Add ALL environment variables to Amplify Console
3. Redeploy
4. Test

**Files already fixed:**
- ✅ `amplify.yml` created
- ✅ `src/libs/prisma.ts` updated
- ✅ `prisma/schema.prisma` updated for Lambda

**What YOU need to do:**
- ⬜ Push changes to Git
- ⬜ Add environment variables in Amplify
- ⬜ Redeploy

---

**After completing these steps, your 500 error should be fixed!** 🎉

