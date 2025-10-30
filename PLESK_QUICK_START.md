# Quick Plesk Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Repository is cloned via Plesk Git
- [ ] Node.js is installed (version 18+)
- [ ] Database is accessible from your server

## 📋 Deployment Steps

### Step 1: First-Time Setup (Run Once)

```bash
# Connect to your server via Plesk console or SSH
cd /var/www/vhosts/yourdomain.com/httpdocs

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Optional: Run database migrations if needed
npx prisma migrate deploy
```

### Step 2: Configure in Plesk

1. Go to **Websites & Domains** → **Node.js**
2. Set **Application startup file:** `server.js`
3. Set **Application mode:** Production
4. Set **Node.js version:** 18.x or higher

### Step 3: Environment Variables

Add these in Plesk Node.js settings or create `.env.production`:

```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
PORT=3000

# Add all your other environment variables from development
```

### Step 4: Start Application

Click **Start** or **Restart** in Plesk Node.js settings.

### Step 5: Verify

1. Check application logs for errors
2. Visit your website
3. Test core functionality

## 🔄 Updates (After Changes)

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Restart in Plesk
```

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change PORT in environment variables |
| Cannot find module | Run `npm install` and `npx prisma generate` |
| Build errors | Check Node.js version (must be 18+) |
| Database connection error | Verify DATABASE_URL and network access |
| 404 on routes | Ensure `.next` folder exists from build |

## 📞 Need Help?

See `PLESK_DEPLOYMENT.md` for detailed instructions.

