# Pre-Upload Checklist

Before uploading to AWS EC2, ensure these files and configurations are ready.

## ✅ Files Created for AWS Deployment

1. **ecosystem.config.js** ✅ - PM2 configuration
2. **env.example.txt** ✅ - Environment variables template
3. **AWS_EC2_DEPLOYMENT.md** ✅ - Complete deployment guide
4. **AWS_QUICK_START.md** ✅ - Quick start guide
5. **AWS_DEPLOYMENT_CHECKLIST.md** ✅ - Deployment checklist
6. **README_DEPLOYMENT.md** ✅ - Deployment overview
7. **PRE_UPLOAD_CHECKLIST.md** ✅ - This file

## ✅ Files Updated for Production

1. **server.js** ✅ - Already in root, configured for 0.0.0.0
2. **package.json** ✅ - Added `aws:setup` script
3. **next.config.js** ✅ - Added production optimizations
4. **create-deployment-package.js** ✅ - Includes server.js

## ⚠️ Before Uploading: Action Required

### 1. Environment Variables

Create your `.env` file locally first (DO NOT upload this):

```bash
# Copy the example
cp env.example.txt .env

# Edit with your actual values
nano .env  # or use your editor
```

**Fill in these values:**
- [ ] DATABASE_URL - Your PostgreSQL connection string
- [ ] NEXT_PUBLIC_APP_URL - Your domain or EC2 IP
- [ ] IRON_SESSION_SECRET - Generate random string
- [ ] All Firebase credentials
- [ ] All API keys (Cloudinary, SendGrid, etc.)

**Generate IRON_SESSION_SECRET:**
```bash
# On Linux/Mac/Git Bash:
openssl rand -base64 32

# Or use online generator
```

### 2. Database Setup

[ ] **Create PostgreSQL database** on AWS RDS or external server  
[ ] **Note the connection string** (needed for DATABASE_URL)  
[ ] **Security group** allows connections from your EC2 IP  

**Connection string format:**
```
postgresql://username:password@host:5432/database_name
```

### 3. Git Repository

[ ] **Push all changes** to your Git repository:
```bash
git add .
git commit -m "Add AWS EC2 deployment configuration"
git push origin main
```

[ ] **Repository is public or** you have SSH access configured

### 4. Domain Configuration (Optional)

[ ] **Domain registered** (if using custom domain)  
[ ] **Access to DNS settings** in domain registrar  
[ ] **EC2 IP noted** for DNS configuration  

### 5. AWS Account

[ ] **AWS account created** and verified  
[ ] **Payment method** configured (for non-free-tier resources)  
[ ] **Basic AWS knowledge** (or following guide step-by-step)  

### 6. Local Testing

Before deploying, test build locally:

```bash
# Install dependencies
npm install

# Create .env with test values
cp env.example.txt .env
# Edit .env with test database

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Should complete without errors
```

If build succeeds locally, it will work on AWS!

## 📦 What to Upload

### Option 1: Git Clone (Recommended)

No upload needed! Clone on EC2:
```bash
git clone https://github.com/yourusername/wendihost.git
```

### Option 2: Upload Files

If not using Git, upload these folders/files:

**Essential:**
- ✅ `src/` - Source code
- ✅ `public/` - Static assets
- ✅ `prisma/` - Database schema
- ✅ `server.js` - Production server
- ✅ `ecosystem.config.js` - PM2 config
- ✅ `package.json` - Dependencies
- ✅ `yarn.lock` - Lock file
- ✅ `next.config.js` - Next.js config
- ✅ `tsconfig.json` - TypeScript config
- ✅ `tailwind.config.js` - Tailwind config
- ✅ `postcss.config.js` - PostCSS config

**NOT Needed on Server:**
- ❌ `.next/` - Will be built on server
- ❌ `node_modules/` - Will be installed on server
- ❌ `.env*` - Will be created on server
- ❌ `.git/` - Not needed
- ❌ `logs/` - Will be created by PM2

## 🚀 Ready to Deploy?

If all checkboxes above are complete:

1. **Go to** `AWS_QUICK_START.md` for fast deployment
2. **Or** follow detailed steps in `AWS_EC2_DEPLOYMENT.md`

## 📋 Deployment Steps (Quick Reference)

```bash
# 1. Launch EC2 instance
# 2. Connect: ssh -i key.pem ubuntu@ec2-ip
# 3. Setup server (Node.js, PM2, Nginx)
# 4. Clone repo: git clone your-repo-url
# 5. Create .env file on server
# 6. Install: npm install
# 7. Setup: npx prisma generate
# 8. Build: npm run build
# 9. Start: pm2 start ecosystem.config.js
# 10. Configure Nginx
# 11. Add SSL certificate
# 12. Point domain to EC2 IP
# 13. Test everything works
```

## ⚠️ Common Pre-Upload Issues

**Issue**: "env.example.txt not found"  
**Solution**: It's named `env.example.txt` (not .env)

**Issue**: "Can't build locally"  
**Solution**: Install dependencies and check Node.js version (18+)

**Issue**: "Prisma errors"  
**Solution**: Ensure DATABASE_URL is valid, run `npx prisma generate`

**Issue**: "Missing dependencies"  
**Solution**: Run `npm install`, check `package.json` is up to date

## 🔐 Security Notes

- [ ] Never commit `.env` file to Git
- [ ] Keep `.pem` key file secure
- [ ] Use strong passwords for database
- [ ] Enable firewall on EC2
- [ ] Use HTTPS with SSL certificate
- [ ] Restrict SSH to your IP only

## 📞 Support Resources

- **Quick Start**: `AWS_QUICK_START.md`
- **Full Guide**: `AWS_EC2_DEPLOYMENT.md`
- **Checklist**: `AWS_DEPLOYMENT_CHECKLIST.md`
- **AWS Docs**: https://docs.aws.amazon.com/ec2/

## ✅ Final Check

Before starting deployment:

- [ ] All files created and updated
- [ ] Environment variables documented
- [ ] Local build successful
- [ ] Git repository up to date
- [ ] AWS account ready
- [ ] Database ready
- [ ] Documentation reviewed

**Everything checked?** → Start with `AWS_QUICK_START.md`

Good luck with your deployment! 🚀

