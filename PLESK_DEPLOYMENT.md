# Plesk Deployment Guide

This guide will help you deploy this Next.js application on Plesk.

## Prerequisites
- Plesk control panel access
- Node.js version 18 or higher installed
- Git access to your repository
- Database access (if using Prisma)

## Deployment Steps

### 1. Initial Setup via Git

1. Log into your Plesk control panel
2. Go to **Websites & Domains** → Your domain
3. Click on **Git** in the left sidebar
4. Click **Clone Repository**
5. Enter your Git repository URL
6. Select deployment branch (usually `main` or `master`)
7. Check **Deploy your application** checkbox
8. In **Document Root**, ensure it's set to your domain's root directory (usually `httpdocs`)
9. Click **OK**

### 2. First-Time Build Setup

After the repository is cloned, you need to build the application:

1. Open **Websites & Domains** → **Node.js**
2. You should see your Node.js application listed
3. Click on **Open Console** (terminal access)

Run these commands in the terminal:

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
npm install
npx prisma generate
npm run build
```

**Note:** Replace `yourdomain.com` with your actual domain name.

### 3. Configure Startup File in Plesk

1. In **Node.js** settings, configure:
   - **Node.js version:** Select the latest Node.js version (18.x or higher)
   - **Application startup file:** `server.js`
   - **Application mode:** Production

### 4. Environment Variables

1. In the Node.js section, find **Environment variables** or create `.env.production` file
2. Add all your production environment variables:
   - Database connection strings
   - API keys
   - Firebase credentials
   - Other secrets

Common variables you'll need:
```env
DATABASE_URL=your_database_url
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# Add all other environment variables from your development .env file
```

### 5. Port Configuration

The `server.js` file is configured to:
- Listen on `0.0.0.0` (all network interfaces)
- Use port 3000 by default
- Accept custom port via `PORT` environment variable

If Plesk assigns a different port:
1. In Node.js settings, note the assigned port
2. Add `PORT=assigned_port` to your environment variables

### 6. Start the Application

1. In **Node.js** settings, click **Start** or **Restart**
2. Monitor the logs to ensure it started successfully
3. Check for any errors in the console

### 7. Post-Deployment

After deployment, you may need to:

1. **Run database migrations** (if any new migrations exist):
   ```bash
   npx prisma migrate deploy
   ```

2. **Set up a reverse proxy** (if needed):
   - Go to **Websites & Domains** → **Apache & nginx Settings**
   - Configure reverse proxy rules if Plesk doesn't handle this automatically

3. **Set up SSL certificate**:
   - Go to **SSL/TLS Settings**
   - Install a Let's Encrypt certificate

### 8. File Permissions

Make sure the following directories have proper write permissions:
- `public/uploads/` - for user uploads
- `.next/` - for Next.js build cache

Run in terminal:
```bash
chmod -R 755 public/uploads
chmod -R 755 .next
```

### 9. Troubleshooting

#### Application won't start:
- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check application logs in Plesk
- Ensure `server.js` exists in the root directory
- Verify the build completed successfully (`.next` folder exists)

#### Database connection issues:
- Verify `DATABASE_URL` is correctly set
- Check database credentials
- Ensure database server allows connections from your Plesk server IP

#### Build fails:
- Check Node.js version compatibility
- Verify all dependencies are installed (`npm install`)
- Check for TypeScript compilation errors
- Ensure Prisma generates correctly (`npx prisma generate`)

#### 404 errors on routes:
- Verify `.next` folder was created during build
- Check that `npm run build` completed successfully
- Ensure `src/` directory exists with all source files

### 10. Updating the Application

To update your application after making changes:

1. **Via Git:**
   ```bash
   git pull origin main  # or your branch name
   npm install  # if package.json changed
   npm run build
   # Restart the application in Plesk
   ```

2. **Or using Plesk Git:**
   - Click **Git** → **Pull** in Plesk
   - Run `npm run build` in the console
   - Restart the application

## Important Notes

- The `start` script in `package.json` now runs `server.js` with production mode
- `server.js` listens on all network interfaces (`0.0.0.0`) for Plesk compatibility
- Port can be customized via `PORT` environment variable
- Always run `npm run build` after pulling updates or changing dependencies
- Keep your environment variables secure and don't commit them to Git

## Support

If you encounter issues:
1. Check the application logs in Plesk
2. Review the terminal console output
3. Verify all prerequisites are met
4. Consult the main README.md for application-specific information

