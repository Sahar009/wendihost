# AWS EC2 Deployment Guide - Step by Step

Complete guide to deploy your Next.js application on AWS EC2 with PM2 and Nginx.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] Domain name (optional but recommended)
- [ ] PostgreSQL database (can use AWS RDS or external)
- [ ] All environment variables ready
- [ ] Git repository accessible

---

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **EC2 Dashboard**

2. **Launch Instance**
   - Click **"Launch Instance"**
   - Name: `wendihost-production` (or your preferred name)

3. **Choose AMI (Operating System)**
   - Select **Ubuntu Server 22.04 LTS** (free tier eligible)
   - Architecture: 64-bit (x86)

4. **Instance Type**
   - For testing: **t2.micro** (free tier)
   - For production: **t2.medium** or **t3.medium** (recommended)
   - Minimum: **t2.small** for Node.js applications

5. **Key Pair**
   - **Create new key pair** or select existing
   - Name: `wendihost-key` (or your preferred name)
   - Key pair type: RSA
   - Private key file format: `.pem`
   - **DOWNLOAD** the key file and save it securely
   - ⚠️ **IMPORTANT**: You cannot download this again!

6. **Network Settings**
   - Auto-assign Public IP: **Enable**
   - Security Group: **Create new security group**
   - Allow SSH: Port 22 from **My IP** (more secure) or **Anywhere-IPv4** (for testing)
   - Allow HTTP: Port 80 from **Anywhere-IPv4**
   - Allow HTTPS: Port 443 from **Anywhere-IPv4**
   - **Click "Add security group rule"** for port 3000
     - Type: Custom TCP
     - Port: 3000
     - Source: 0.0.0.0/0
     - Description: Node.js app

7. **Configure Storage**
   - Size: **20 GB** (minimum, increase for production)
   - Volume type: gp3 (default)

8. **Launch Instance**
   - Click **"Launch Instance"**
   - Wait for instance to be **Running** (green status)

---

## Step 2: Setup Static IP (Optional but Recommended)

Static IP ensures your IP doesn't change when you restart.

1. **In EC2 Console**, go to **Elastic IPs** (left sidebar)
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the IP and click **"Actions" → "Associate Elastic IP address"**
5. Select your EC2 instance
6. Click **"Associate"**

**Note your Public IPv4 address** - you'll need it!

---

## Step 3: Connect to EC2 Instance

### Windows Users:

#### Option A: Using PowerShell/CMD
```powershell
# Change to directory where your .pem file is stored
cd C:\path\to\your\key\file

# Set permissions (run in PowerShell as Administrator)
icacls wendihost-key.pem /inheritance:r
icacls wendihost-key.pem /grant:r "%username%:R"

# Connect via SSH
ssh -i wendihost-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### Option B: Using Git Bash or WSL
```bash
# Change to directory where your .pem file is stored
cd /c/path/to/your/key/file

# Set permissions
chmod 400 wendihost-key.pem

# Connect
ssh -i wendihost-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Mac/Linux Users:
```bash
# Change to directory where your .pem file is stored
cd ~/path/to/your/key/file

# Set permissions
chmod 400 wendihost-key.pem

# Connect
ssh -i wendihost-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP address.

**First time connecting?** Type `yes` when prompted about authenticity.

---

## Step 4: Initial Server Setup

Once connected to EC2, run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget build-essential
```

---

## Step 5: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher

# Install Yarn (if using yarn.lock)
sudo npm install -g yarn
```

---

## Step 6: Install PM2

PM2 is a process manager for Node.js that keeps your app running.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 to start on boot
pm2 startup

# Follow the instructions on screen. It will show a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run that command exactly as shown

# Verify startup is configured
pm2 save
```

---

## Step 7: Install PostgreSQL Client (Optional)

Only needed if you need to connect to database from server:

```bash
sudo apt install -y postgresql-client
```

---

## Step 8: Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/wendihost.git

# OR if using SSH:
# git clone git@github.com:yourusername/wendihost.git

# Navigate into project
cd wendihost

# Check files
ls -la
```

---

## Step 9: Install Dependencies

```bash
# Inside your project directory
# Install all dependencies
npm install

# OR if using yarn:
yarn install

# Generate Prisma client
npx prisma generate
```

---

## Step 10: Configure Environment Variables

```bash
# Create .env file
nano .env
```

**Copy your environment variables** from `.env.example` and fill in real values:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# App
NODE_ENV=production
PORT=3000

# Your domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Add all other variables from .env.example
```

Save file: Press `Ctrl + O`, then `Enter`, then `Ctrl + X`

---

## Step 11: Run Database Migrations

```bash
# Run pending migrations
npx prisma migrate deploy

# OR if you need to reset database (⚠️ deletes data):
# npx prisma migrate reset
```

---

## Step 12: Build Application

```bash
# Build Next.js application
npm run build

# OR
yarn build

# This will create .next folder with production build
# Wait for completion - it may take 5-10 minutes
```

---

## Step 13: Start Application with PM2

```bash
# Start application using PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs wendihost

# Save PM2 process list
pm2 save
```

Your app should now be running on port 3000!

**Test it:** Open browser and go to `http://YOUR_EC2_IP:3000`

---

## Step 14: Install and Configure Nginx

Nginx will be a reverse proxy in front of your Node.js app.

### 14.1 Install Nginx

```bash
sudo apt install -y nginx

# Check status
sudo systemctl status nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 14.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/wendihost
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase client body size for file uploads
    client_max_body_size 100M;

    # Logging
    access_log /var/log/nginx/wendihost-access.log;
    error_log /var/log/nginx/wendihost-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Save:** `Ctrl + O`, `Enter`, `Ctrl + X`

**Important:** Replace `yourdomain.com` with your actual domain!

### 14.3 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/wendihost /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test successful, restart Nginx
sudo systemctl restart nginx
```

---

## Step 15: Setup SSL with Let's Encrypt

Free SSL certificate using Certbot.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# Email: your-email@example.com
# Terms: Accept
# Newsletter: Your choice
# Redirect HTTP to HTTPS: Yes
```

**Certbot will automatically configure Nginx!**

### Auto-renewal (already set up)

```bash
# Check renewal
sudo certbot renew --dry-run

# Certbot auto-renews certificates
```

---

## Step 16: Configure Domain DNS

Point your domain to EC2:

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Find DNS settings**
3. **Add/Edit A record:**
   - Type: A
   - Name: @ (or leave blank)
   - Value: YOUR_EC2_PUBLIC_IP
   - TTL: 3600 (or default)
4. **Save**

Wait 5-30 minutes for DNS propagation.

---

## Step 17: Verify Everything Works

1. **Visit your domain:** `https://yourdomain.com`
2. **Check PM2:** `pm2 status`
3. **Check Nginx:** `sudo systemctl status nginx`
4. **Check logs:** `pm2 logs`

---

## Step 18: Security Hardening (Important!)

### 18.1 Update Security Group

In AWS Console → EC2 → Security Groups:

- Remove public access to port 3000
- Keep only 22 (SSH), 80 (HTTP), 443 (HTTPS)
- SSH should only allow "My IP"

### 18.2 Fail2Ban (Optional but Recommended)

Protect against brute force attacks:

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Step 19: Setup Automatic Backups (Optional)

### Database Backups

```bash
# Create backup script
nano ~/backup-db.sh
```

Paste:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > ~/backups/db_backup_$DATE.sql
find ~/backups -name "db_backup_*.sql" -mtime +7 -delete
```

Setup:
```bash
chmod +x ~/backup-db.sh
mkdir -p ~/backups
crontab -e
# Add: 0 2 * * * ~/backup-db.sh
```

---

## Step 20: Monitoring and Maintenance

### Useful PM2 Commands

```bash
pm2 status              # Check app status
pm2 logs wendihost      # View logs
pm2 restart wendihost   # Restart app
pm2 stop wendihost      # Stop app
pm2 monit              # Real-time monitoring
pm2 delete wendihost   # Remove from PM2
```

### Useful Nginx Commands

```bash
sudo nginx -t                    # Test configuration
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart Nginx
sudo tail -f /var/log/nginx/error.log  # View errors
```

### Check System Resources

```bash
htop                    # System monitor (install: sudo apt install htop)
df -h                   # Disk usage
free -h                 # Memory usage
```

---

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs wendihost --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 describe wendihost

# Restart PM2
pm2 restart all
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### Database connection issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check if DATABASE_URL is set
echo $DATABASE_URL

# Restart app to reload env vars
pm2 restart wendihost
```

### SSL certificate issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew manually (if needed)
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

### "Cannot find module" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

### Port 80 already in use

```bash
# Check what's using port 80
sudo lsof -i :80

# Usually it's Apache, stop it
sudo systemctl stop apache2
sudo systemctl disable apache2
```

---

## Updating Your Application

When you make changes to your code:

```bash
# Pull latest code
cd ~/wendihost
git pull origin main

# Install any new dependencies
npm install

# Rebuild if needed
npm run build

# Regenerate Prisma if schema changed
npx prisma generate
npx prisma migrate deploy

# Restart application
pm2 restart wendihost

# Check status
pm2 logs wendihost
```

---

## Cost Estimation

### Monthly Costs (US East region)

| Resource | Size | Monthly Cost |
|----------|------|--------------|
| EC2 t2.micro | 1 GB RAM | **FREE** (first 12 months) |
| EC2 t2.small | 2 GB RAM | ~$15 |
| EC2 t2.medium | 4 GB RAM | ~$30 |
| RDS PostgreSQL | db.t3.micro | **FREE** (first 12 months) |
| Elastic IP | - | **FREE** (if attached) |
| Data Transfer | 100 GB | ~$9 |
| **Total (small)** | - | **$15-20/month** |
| **Total (medium)** | - | **$40-50/month** |

---

## Additional Resources

- AWS Documentation: https://docs.aws.amazon.com/ec2/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/

---

## Quick Reference Commands

```bash
# Connect to server
ssh -i wendihost-key.pem ubuntu@YOUR_IP

# View app logs
pm2 logs wendihost

# Restart app
pm2 restart wendihost

# Check status
pm2 status

# Update app
cd ~/wendihost && git pull && npm install && npm run build && pm2 restart wendihost
```

---

## Support

If you encounter issues:

1. Check logs: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
2. Verify environment variables are set correctly
3. Ensure database is accessible from EC2
4. Check security groups allow necessary ports
5. Verify SSL certificate is valid

**Congratulations!** Your application should now be running on AWS EC2! 🎉

