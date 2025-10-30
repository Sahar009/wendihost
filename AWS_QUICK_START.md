# AWS EC2 Quick Start Guide

## Pre-Deployment Checklist

- [ ] AWS account created
- [ ] EC2 instance launched with Ubuntu 22.04
- [ ] Key pair (.pem file) downloaded
- [ ] Security group configured (ports 22, 80, 443, 3000)
- [ ] PostgreSQL database ready (RDS or external)
- [ ] Domain name ready (optional)
- [ ] All environment variables documented

---

## Step 1: Launch EC2 Instance (5 minutes)

### AWS Console → EC2

1. **Launch Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance: t2.micro (free tier) or t2.medium (production)
   - Key pair: Create and download `.pem` file
   - Network settings: Add rules for ports 22, 80, 443, 3000

2. **Note your Public IP address**

3. **Allocate Elastic IP** (recommended)
   - EC2 → Elastic IPs → Allocate
   - Associate with your instance

---

## Step 2: Connect to EC2 (2 minutes)

### Windows (PowerShell/Git Bash):
```bash
ssh -i wendihost-key.pem ubuntu@YOUR_EC2_IP
```

### Mac/Linux:
```bash
chmod 400 wendihost-key.pem
ssh -i wendihost-key.pem ubuntu@YOUR_EC2_IP
```

Replace `YOUR_EC2_IP` with your actual IP address.

---

## Step 3: Server Setup (10 minutes)

Run these commands on your EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL client
sudo apt install -y postgresql-client
```

---

## Step 4: Clone Repository (2 minutes)

```bash
cd ~
git clone https://github.com/yourusername/wendihost.git
cd wendihost
```

Replace with your actual repository URL.

---

## Step 5: Configure Environment (5 minutes)

```bash
# Create .env file
nano .env
```

**Copy from `env.example.txt` and fill in values:**

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# ... add all other variables
```

Save: `Ctrl + O`, `Enter`, `Ctrl + X`

---

## Step 6: Install & Build (15-20 minutes)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build
```

⚠️ **This step takes time!** Be patient.

---

## Step 7: Start Application (2 minutes)

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 logs wendihost
```

Test: Open browser → `http://YOUR_EC2_IP:3000`

---

## Step 8: Configure Nginx (5 minutes)

```bash
# Create config
sudo nano /etc/nginx/sites-available/wendihost
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save and enable:**
```bash
sudo ln -s /etc/nginx/sites-available/wendihost /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9: Add SSL Certificate (5 minutes)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts!

---

## Step 10: Domain Setup (5 minutes)

In your domain registrar:

1. Go to DNS settings
2. Add A record:
   - Type: A
   - Name: @
   - Value: YOUR_EC2_IP
   - TTL: 3600

Wait 5-30 minutes for DNS propagation.

---

## ✅ Done!

Visit: `https://yourdomain.com`

---

## Update Your App

```bash
cd ~/wendihost
git pull origin main
npm install
npm run build
pm2 restart wendihost
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect via SSH | Check security group allows port 22 from your IP |
| App won't start | Check logs: `pm2 logs` |
| 502 Bad Gateway | Check if app is running: `pm2 status` |
| Database errors | Verify DATABASE_URL is correct |
| SSL errors | Run: `sudo certbot renew` |

---

## Useful Commands

```bash
# View logs
pm2 logs wendihost

# Restart app
pm2 restart wendihost

# Check status
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Security Checklist

- [ ] Security group only allows necessary ports
- [ ] SSH key is secure
- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Environment variables are set
- [ ] PM2 auto-restart configured
- [ ] Regular backups scheduled

---

**For detailed instructions, see `AWS_EC2_DEPLOYMENT.md`**

