# Subdomain Setup Guide

## For Subdomains like `devy.wendi.app`

To make subdomains work, you need to configure DNS records. Here are the steps:

### Option 1: Wildcard DNS Record (Recommended)

Create a wildcard A record or CNAME record in your DNS provider:

```
Type: A
Name: *
Value: 38.242.153.189
TTL: 3600
```

OR

```
Type: CNAME
Name: *
Value: wendi.app
TTL: 3600
```

This will make ALL subdomains (devy.wendi.app, test.wendi.app, etc.) point to your server.

### Option 2: Individual Subdomain Records

For each subdomain, create an individual record:

```
Type: A
Name: devy
Value: 38.242.153.189
TTL: 3600
```

OR

```
Type: CNAME
Name: devy
Value: wendi.app
TTL: 3600
```

### Server Configuration

1. **Ensure your server accepts requests from any subdomain**
   - The server.js is already configured to accept requests from any domain
   - Make sure your hosting provider allows wildcard subdomains

2. **SSL Certificate**
   - You'll need a wildcard SSL certificate for `*.wendi.app`
   - Or use Let's Encrypt with DNS validation for wildcard certificates

3. **Testing**
   - After DNS propagation (can take up to 48 hours, usually 1-2 hours)
   - Visit `https://devy.wendi.app` (or your subdomain)
   - The middleware will detect the subdomain and look up the reseller
   - If the reseller exists, custom branding will be applied

### Troubleshooting

1. **Check DNS propagation**: Use `nslookup devy.wendi.app` or `dig devy.wendi.app`
2. **Check server logs**: Look for "Looking up subdomain" messages
3. **Verify subdomain in database**: Make sure the subdomain is saved correctly in the `reseller` table
4. **Check case sensitivity**: The code now handles case-insensitive matching

### Current Implementation

- ✅ Subdomain detection in middleware
- ✅ Case-insensitive subdomain lookup
- ✅ Custom branding based on subdomain
- ⚠️ Requires DNS configuration (not automatic)
- ⚠️ Requires SSL certificate for HTTPS


