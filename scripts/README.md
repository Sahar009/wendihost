# Template Activation Scripts

This directory contains scripts to manage WhatsApp template activation and synchronization.

## Scripts Overview

### 1. `activate-pending-templates.js` - Main Activation Script
**Purpose**: Activates all pending templates in the database

**Usage**:
```bash
# Activate all pending templates
node scripts/activate-pending-templates.js

# Create sample templates first (if none exist)
node scripts/activate-pending-templates.js create
```

**Features**:
- ✅ Activates all PENDING templates to APPROVED status
- 📊 Shows template status summary before and after
- 🎯 Lists all pending templates before activation
- 📈 Provides final summary of active templates

### 2. `create-pending-templates.js` - Test Data Script
**Purpose**: Creates sample pending templates for testing

**Usage**:
```bash
node scripts/create-pending-templates.js
```

**Features**:
- ⏳ Creates 3 sample pending templates
- 🔍 Checks for existing templates to avoid duplicates
- 📊 Shows current template status after creation

### 3. `activate-templates.js` - Advanced Script
**Purpose**: Advanced template management with multiple options

**Usage**:
```bash
# Activate all pending templates
node scripts/activate-templates.js

# List all template statuses
node scripts/activate-templates.js list

# Activate templates for specific workspace
node scripts/activate-templates.js workspace <workspaceId>
```

### 4. `sync-and-activate-templates.js` - Facebook Sync Script
**Purpose**: Syncs templates from Facebook API and activates pending ones

**Usage**:
```bash
# Sync from Facebook and activate pending
node scripts/sync-and-activate-templates.js

# Just activate existing pending templates
node scripts/sync-and-activate-templates.js activate
```

## Template Status Values

- **PENDING** ⏳ - Template is waiting for approval
- **APPROVED** ✅ - Template is active and can be used
- **REJECTED** ❌ - Template was rejected by Facebook
- **SUBMITTED** 📝 - Template has been submitted for review

## Quick Start

1. **Check current status**:
   ```bash
   node scripts/activate-templates.js list
   ```

2. **Activate all pending templates**:
   ```bash
   node scripts/activate-pending-templates.js
   ```

3. **Create test templates** (if needed):
   ```bash
   node scripts/create-pending-templates.js
   ```

## Common Use Cases

### Scenario 1: First-time Setup
```bash
# Create sample templates
node scripts/activate-pending-templates.js create

# Activate them
node scripts/activate-pending-templates.js
```

### Scenario 2: Regular Maintenance
```bash
# Check what needs activation
node scripts/activate-templates.js list

# Activate pending templates
node scripts/activate-pending-templates.js
```

### Scenario 3: Workspace-specific Activation
```bash
# Activate templates for workspace ID 2
node scripts/activate-templates.js workspace 2
```

## Sample Output

```
🚀 Activating all pending templates...

📊 Found 6 total templates in database

📋 Current Template Status:
  ⏳ PENDING: 3 templates
  ✅ APPROVED: 3 templates

⏳ Found 3 pending templates

📋 Pending Templates:
1. pending_welcome (UTILITY) - Workspace: develop
2. pending_notification (UTILITY) - Workspace: develop
3. pending_reminder (UTILITY) - Workspace: develop

🔄 Activating templates...
✅ Successfully activated 3 templates!

📊 Final Status:
  ✅ APPROVED: 6 templates

🎉 Summary: 6/6 templates are now active!
```

## Troubleshooting

### No Templates Found
If you see "No templates found in database":
1. Create templates through the web interface first
2. Or run: `node scripts/activate-pending-templates.js create`

### Database Connection Issues
Make sure your `.env` file has the correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Permission Errors
On Windows, you might need to run PowerShell as Administrator for file operations.

## Integration with Chat System

Once templates are activated (status = APPROVED), they will be available for:
- ✅ Sending template messages to users
- ✅ Campaign automation
- ✅ Broadcast messages
- ✅ Chatbot template responses

The chat system specifically looks for templates with `status: 'APPROVED'` when sending messages to users.

