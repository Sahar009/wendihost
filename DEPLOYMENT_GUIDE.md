# Production Deployment Guide

## Files to Upload to Server

Upload the following files/folders to your production server:

### Essential Files:
1. **`.next`** folder - The built application
2. **`node_modules`** folder - Dependencies (or reinstall on server)
3. **`package.json`** - Project configuration
4. **`yarn.lock`** - Lock file for consistent dependencies
5. **`src`** folder - Source code needed for server-side rendering
6. **`public`** folder - Static assets
7. **`prisma`** folder - Database schema and migrations
8. **`next.config.js`** - Next.js configuration
9. **`tailwind.config.js`** - Tailwind configuration
10. **`tsconfig.json`** - TypeScript configuration
11. **`postcss.config.js`** - PostCSS configuration

### Environment Files:
- `.env` or `.env.production` - Production environment variables

### Exclude (Don't Upload):
- `node_modules` (better to install on server to ensure consistency)
- `.git` folder
- `.env.local` files
- Development-only files

## Recommended Approach

**Option 1: Upload Everything (Recommended for simple deployments)**
1. Zip the entire project (excluding node_modules and .git)
2. Upload to server
3. On server, run:
   ```bash
   yarn install --production
   npx prisma generate
   yarn start
   ```

**Option 2: Build on Server**
1. Upload source code only (without .next and node_modules)
2. On server, run:
   ```bash
   yarn install
   npx prisma generate
   yarn build
   yarn start
   ```

## Quick Upload Script

You can use the `create-deployment-package.js` script to create a production-ready zip file excluding unnecessary files.

