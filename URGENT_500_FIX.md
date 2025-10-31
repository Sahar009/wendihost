# 🚨 URGENT: 500 Error Fix Steps

## Your Build Succeeded But Getting 500 Error

This means the code is fine, but **environment variables are missing**.

---

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Add Environment Variables (CRITICAL!)

Go to **AWS Amplify Console** → Your App → **Environment variables**

**Add ALL these variables:**

```env
# DATABASE (CRITICAL - this causes 500 if missing!)
DATABASE_URL=postgresql://user:password@host:5432/database

# SESSION (CRITICAL - causes 500 if missing!)
SESSION_PASSWORD=type-your-random-secret-here-about-32-chars-long
IRON_SESSION_SECRET=type-your-random-secret-here-about-32-chars-long

# APP
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://main.d1g7n7qzu0zuv4.amplifyapp.com

# FIREBASE (Add ALL of these from your Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# CLOUDINARY (Add from Cloudinary Dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

# OTHER (Add from env.example.txt)
# ... add any other environment variables you use
```

### Step 2: Redeploy After Adding Variables

**Option A: Redeploy**
1. Amplify Console → "Redeploy this version"
2. Wait for deployment to complete

**Option B: Git Push** (I'll create test endpoint)
```bash
git add src/pages/api/test-db.ts
git commit -m "Add database test endpoint"
git push
```

### Step 3: Test Database Connection

After deployment, visit:
```
https://main.d1g7n7qzu0zuv4.amplifyapp.com/api/test-db
```

**This will tell you exactly what's wrong!**

---

## 🔍 Most Common Issues

### Issue 1: "DATABASE_URL" not set (99% of cases)

**Error in logs:** "DATABASE_URL environment variable is not set"  
**Fix:** Add DATABASE_URL to Environment Variables

### Issue 2: Database not accessible

**Error:** "Connection refused" or "timeout"  
**Fix:** Your PostgreSQL database must be publicly accessible from internet

### Issue 3: Wrong DATABASE_URL format

**Error:** "Connection string invalid"  
**Fix:** Use correct format: `postgresql://user:password@host:5432/database`

### Issue 4: SESSION_PASSWORD missing

**Error:** "SESSION_PASSWORD not found"  
**Fix:** Add SESSION_PASSWORD to environment variables

---

## 📝 Where to Get Values

### DATABASE_URL

From your PostgreSQL provider:
- AWS RDS: Check "Connectivity & security" tab
- Railway: Check "Connect" tab
- Supabase: Check Settings → Database
- Other: Check your database provider docs

### SESSION_PASSWORD & IRON_SESSION_SECRET

Generate random strings:
```bash
openssl rand -base64 32
```

Run this command **twice** to generate 2 different secrets.

### Firebase

From Firebase Console:
1. Go to Project Settings
2. Scroll to "Your apps" section
3. Copy the config values

### Cloudinary

From Cloudinary Dashboard:
1. Go to Settings
2. Copy Cloud name
3. Go to Settings → Upload
4. Copy Upload preset

---

## 🧪 Debugging Steps

### 1. Check Runtime Logs

**AWS Amplify Console → Monitoring → Logs**

Look for:
- "DATABASE_URL" errors
- "Prisma" errors  
- "SESSION_PASSWORD" errors
- Any stack traces

### 2. Test Database Connection

After deploying `test-db.ts`:

Visit: `https://main.d1g7n7qzu0zuv4.amplifyapp.com/api/test-db`

**If you see:**
```json
{"success": true, "userCount": 0}
```
✅ Database works!

**If you see:**
```json
{"success": false, "error": "..."}
```
❌ Check the error message

### 3. Check Build Logs

**AWS Amplify Console → Build history → Latest build → Build logs**

Look for:
- Prisma generation success
- Build completion
- Any warnings

---

## ⚡ Quick Checklist

- [ ] Added DATABASE_URL to environment variables
- [ ] Added SESSION_PASSWORD to environment variables
- [ ] Added IRON_SESSION_SECRET to environment variables
- [ ] Added all Firebase variables
- [ ] Added all Cloudinary variables
- [ ] Redeployed application
- [ ] Checked runtime logs for errors
- [ ] Tested /api/test-db endpoint

---

## 🆘 Still Not Working?

If after adding all variables it still doesn't work:

1. **Check runtime logs** - What exact error shows?
2. **Test /api/test-db** - Does database connect?
3. **Verify DATABASE_URL** - Is it correct format?
4. **Check database security** - Is it publicly accessible?
5. **Review AMPLIFY_TROUBLESHOOTING.md** - Full troubleshooting guide

---

## 📞 Share This Info

If you need help, share:
1. What shows in `/api/test-db` endpoint
2. Last 50 lines of runtime logs
3. Whether DATABASE_URL is set (without sharing the actual value)

---

## ✅ Success Criteria

You'll know it's fixed when:
- ✅ `/auth/login` loads without 500 error
- ✅ `/api/test-db` returns `{"success": true}`
- ✅ No errors in runtime logs

---

**GO ADD THOSE ENVIRONMENT VARIABLES NOW!** 🚀

They're in the Amplify Console under App settings → Environment variables.


