# Deployment Summary

This project is configured for deployment on **AWS EC2**.

## Quick Links

- **AWS Quick Start Guide**: `AWS_QUICK_START.md` - Get started in 10 steps
- **Complete AWS Guide**: `AWS_EC2_DEPLOYMENT.md` - Full detailed instructions
- **Deployment Checklist**: `AWS_DEPLOYMENT_CHECKLIST.md` - Verify everything is done
- **Environment Variables**: `env.example.txt` - Copy and fill in your values

## What's Configured

✅ `server.js` - Custom Node.js server for production  
✅ `ecosystem.config.js` - PM2 process manager configuration  
✅ `package.json` - Scripts updated for AWS deployment  
✅ `next.config.js` - Production optimizations enabled  
✅ Environment template - All required variables documented  

## Deployment Methods

### AWS EC2 (Recommended)
Complete guide: `AWS_EC2_DEPLOYMENT.md`

**Features:**
- Ubuntu Server 22.04
- Node.js 18.x
- PM2 process manager
- Nginx reverse proxy
- Let's Encrypt SSL
- Auto-restart on reboot

### Other Options
- **Vercel**: Already in README.md (easiest for Next.js)
- **Netlify**: Use `build-netlify` script
- **Docker**: Create Dockerfile (future enhancement)

## Environment Setup

Copy `env.example.txt` to `.env` and fill in your values:

```bash
cp env.example.txt .env
nano .env  # Edit with your values
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Your domain URL
- `IRON_SESSION_SECRET` - Random secret key
- Other service APIs (Firebase, SendGrid, etc.)

## Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build for production
npm run build

# Start production server
npm start

# AWS specific setup
npm run aws:setup  # Generates Prisma client and builds
```

## File Structure

```
wendihost/
├── server.js              # Custom Node.js server
├── ecosystem.config.js    # PM2 configuration
├── package.json           # Updated scripts
├── next.config.js         # Production optimizations
├── env.example.txt        # Environment template
├── AWS_QUICK_START.md     # Quick deployment guide
├── AWS_EC2_DEPLOYMENT.md  # Full deployment guide
├── AWS_DEPLOYMENT_CHECKLIST.md  # Deployment checklist
└── README_DEPLOYMENT.md   # This file
```

## Next Steps

1. **Review** `AWS_QUICK_START.md` for overview
2. **Follow** `AWS_EC2_DEPLOYMENT.md` step-by-step
3. **Check** `AWS_DEPLOYMENT_CHECKLIST.md` as you go
4. **Setup** environment variables from `env.example.txt`

## Support

- AWS Documentation: https://docs.aws.amazon.com/ec2/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Next.js Deployment: https://nextjs.org/docs/deployment

## Cost Estimate

- **EC2 t2.micro**: FREE (first 12 months)
- **EC2 t2.medium**: ~$30/month
- **RDS PostgreSQL**: FREE (first 12 months) or ~$15/month
- **Domain + SSL**: Included with Let's Encrypt
- **Total**: $15-50/month depending on resources

## Architecture

```
Internet
    ↓
[Domain Name → Route 53 DNS]
    ↓
[CloudFlare / Nginx]
    ↓
[SSL Cert (Let's Encrypt)]
    ↓
[Nginx Reverse Proxy :80/443]
    ↓
[PM2 Process Manager]
    ↓
[Next.js App :3000]
    ↓
[RDS PostgreSQL]
```

## Common Issues

**Issue**: "Cannot find production build"  
**Solution**: Run `npm run build` first

**Issue**: "Port 3000 already in use"  
**Solution**: Stop other Node processes or change PORT in .env

**Issue**: "Database connection refused"  
**Solution**: Check DATABASE_URL and security group rules

**Issue**: "502 Bad Gateway"  
**Solution**: Verify app is running with `pm2 status`

See `AWS_EC2_DEPLOYMENT.md` for detailed troubleshooting.

