# Lead Generation System - Setup Guide

## Phase 1: Foundation ✅ COMPLETED

### What Was Implemented:

1. **Database Schema** ✅
   - Added 5 new models: `LeadCampaign`, `Lead`, `OutreachLog`, `LandingPage`, `FormSubmission`
   - Added 3 new enums: `LeadSource`, `LeadStatus`, `CampaignStatus`
   - Database synced successfully using `prisma db push`

2. **Folder Structure** ✅
   - Created `/src/pages/dashboard/leadgen/` with subdirectories
   - Created `/src/pages/api/[workspaceId]/leadgen/` with subdirectories
   - Created `/src/services/leadgen/` for business logic
   - Created `/src/pages/f/` for public landing pages

3. **Core Services** ✅
   - Google Places API scraper service (`/src/services/leadgen/google-places.ts`)
   - Scraping API endpoint (`/api/[workspaceId]/leadgen/scrape-places.ts`)
   - Stats API endpoint (`/api/[workspaceId]/leadgen/stats.ts`)

4. **Dashboard Pages** ✅
   - Main dashboard (`/dashboard/leadgen/index.tsx`)
   - Scraper UI (`/dashboard/leadgen/scraper.tsx`)

---

## Environment Setup

### Required Environment Variables

Add this to your `.env` or `.env.local` file:

```bash
# Google Places API Key (Required for lead scraping)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### How to Get Google Places API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Places API** and **Geocoding API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and add to your `.env` file
6. **Important**: Set up billing (Google provides $200 free credit monthly)

### Pricing (as of 2024):
- Text Search: $0.032 per request
- Place Details: $0.017 per request
- Geocoding: $0.005 per request
- **Estimated cost**: ~$0.05 per lead scraped

---

## TypeScript Errors (Expected)

You may see TypeScript errors about `prisma.lead` or `prisma.leadCampaign` not existing. These will resolve automatically when you:

1. Restart your dev server: `npm run dev`
2. The Prisma Client will be regenerated on server start

---

## Testing the Implementation

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Navigate to Lead Gen Dashboard
```
http://localhost:3000/dashboard/leadgen
```

### 3. Test the Scraper
1. Go to "Scrape Leads" or `/dashboard/leadgen/scraper`
2. Select a business type (e.g., "Restaurant")
3. Enter a location (e.g., "Lagos, Nigeria")
4. Click "Start Scraping"
5. View results

---

## Next Steps: Phase 2 - Backend API

To continue implementation, you need to build:

1. **Campaign Management APIs**
   - Create campaign
   - List campaigns
   - Update campaign
   - Delete campaign

2. **Lead Management APIs**
   - List leads
   - Get lead details
   - Update lead status
   - Add notes to lead
   - Import leads (CSV)

3. **Form Builder APIs**
   - Create landing page
   - Update landing page
   - Submit form (public endpoint)

---

## File Structure Created

```
src/
├── pages/
│   ├── dashboard/
│   │   └── leadgen/
│   │       ├── index.tsx              ✅ Main dashboard
│   │       ├── scraper.tsx            ✅ Scraper UI
│   │       ├── campaigns/             📁 Created (empty)
│   │       ├── leads/                 📁 Created (empty)
│   │       └── forms/                 📁 Created (empty)
│   ├── api/
│   │   └── [workspaceId]/
│   │       └── leadgen/
│   │           ├── scrape-places.ts   ✅ Scraping endpoint
│   │           ├── stats.ts           ✅ Stats endpoint
│   │           ├── campaigns/         📁 Created (empty)
│   │           ├── leads/             📁 Created (empty)
│   │           └── forms/             📁 Created (empty)
│   └── f/                             📁 Public forms (empty)
└── services/
    └── leadgen/
        └── google-places.ts           ✅ Google Places service
```

---

## Database Models

### LeadCampaign
- Campaign management
- Tracks scraping configuration
- Links to landing pages
- Tracks metrics (leads, contacted, responded, converted)

### Lead
- Individual business/contact
- Stores Google Places data
- Status tracking (NEW, CONTACTED, INTERESTED, etc.)
- Links to campaigns

### OutreachLog
- Tracks all outreach attempts
- WhatsApp message history
- Response tracking

### LandingPage
- Form builder configuration
- Custom branding
- Tracks views and submissions

### FormSubmission
- Captures form data
- Links to leads
- Tracks source (IP, referrer, etc.)

---

## Known Issues

1. **TypeScript Errors**: Will resolve on dev server restart
2. **Google API Key**: Must be configured before scraping works
3. **Database**: Already synced, no migration needed

---

## Support

If you encounter issues:
1. Check that `GOOGLE_PLACES_API_KEY` is set
2. Restart dev server: `npm run dev`
3. Check console for detailed error messages
4. Verify database connection is working
