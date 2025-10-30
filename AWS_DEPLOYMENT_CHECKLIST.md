# AWS EC2 Deployment Checklist

Use this checklist to ensure you've completed all deployment steps.

## Pre-Deployment

- [ ] AWS account created and verified
- [ ] EC2 instance launched (Ubuntu 22.04)
- [ ] Key pair (.pem file) downloaded and secured
- [ ] Security group configured (ports: 22, 80, 443, 3000)
- [ ] Static IP allocated (Elastic IP)
- [ ] PostgreSQL database set up (RDS or external)
- [ ] Domain name registered (optional)
- [ ] All environment variables documented in `env.example.txt`
- [ ] Firewall rules verified

## Server Setup

- [ ] Connected to EC2 via SSH
- [ ] System packages updated (`sudo apt update && upgrade`)
- [ ] Node.js 18.x installed
- [ ] PM2 installed globally
- [ ] PM2 startup configured (`pm2 startup`)
- [ ] Nginx installed
- [ ] PostgreSQL client installed
- [ ] Git installed

## Application Setup

- [ ] Repository cloned to EC2
- [ ] `.env` file created with all variables
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Application built (`npm run build`)
- [ ] PM2 started (`pm2 start ecosystem.config.js`)
- [ ] PM2 saved (`pm2 save`)
- [ ] Application accessible on port 3000

## Nginx Configuration

- [ ] Nginx config created (`/etc/nginx/sites-available/wendihost`)
- [ ] Config enabled (symlink created)
- [ ] Default site removed
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx restarted
- [ ] HTTP accessible (port 80)

## SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS redirected from HTTP
- [ ] SSL certificate valid
- [ ] Auto-renewal tested (`sudo certbot renew --dry-run`)

## Domain Configuration

- [ ] DNS A record added
- [ ] DNS propagated (checked via `nslookup`)
- [ ] Domain accessible via HTTPS
- [ ] WWW subdomain configured

## Security

- [ ] Security group restricted (SSH only from your IP)
- [ ] Port 3000 not publicly accessible
- [ ] SSL certificate installed and enforced
- [ ] Environment variables secured
- [ ] SSH key secured (.pem file permissions)
- [ ] PM2 monitoring enabled
- [ ] Firewall rules reviewed

## Testing

- [ ] Homepage loads
- [ ] Authentication works
- [ ] Database connections work
- [ ] API endpoints respond
- [ ] File uploads work
- [ ] All features tested
- [ ] HTTPS enforced everywhere
- [ ] No console errors

## Monitoring & Maintenance

- [ ] PM2 logs checked
- [ ] Nginx logs checked
- [ ] System resources monitored
- [ ] Backup strategy implemented
- [ ] Update process documented
- [ ] Log rotation configured
- [ ] Monitoring alerts set up (optional)

## Post-Deployment

- [ ] Application fully functional
- [ ] Documentation updated
- [ ] Team members notified
- [ ] Old environment variables backed up
- [ ] Deployment process documented
- [ ] Rollback plan prepared

## Emergency Contacts

- AWS Support: ________________________________
- Database Admin: ____________________________
- Domain Registrar: __________________________
- Team Lead: _________________________________

## Quick Commands Reference

```bash
# Connect to server
ssh -i your-key.pem ubuntu@your-ip

# View app logs
pm2 logs wendihost

# Restart app
pm2 restart wendihost

# Check app status
pm2 status

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# View recent errors
sudo tail -f /var/log/nginx/error.log

# Update application
cd ~/wendihost && git pull && npm install && npm run build && pm2 restart wendihost
```

## Notes

_Use this space to document any issues encountered or custom configurations:_




