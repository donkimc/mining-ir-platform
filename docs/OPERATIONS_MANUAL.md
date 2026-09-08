# SaaS Operations Manual

Complete guide for SaaS operators to onboard new clients, configure custom domains, and manage deployed websites.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding a New Tenant](#adding-a-new-tenant)
3. [Configuring Custom Domain](#configuring-custom-domain)
4. [Deployment Workflow](#deployment-workflow)
5. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SaaS Platform Architecture                   │
└─────────────────────────────────────────────────────────────────┘

Production Domain: nrlaunch.com
├── apex (nrlaunch.com)              → Marketing Shell (not a tenant)
├── www (www.nrlaunch.com)           → Redirects to apex
├── admin (admin.nrlaunch.com)       → Login, Dashboard, Admin Panel
│                                     (All authenticated surfaces)
└── <tenant-slug>.nrlaunch.com       → Tenant IR websites
    ├── qelvarion-resource.nrlaunch.com    (Explorer template)
    ├── veylithra-tungsten.nrlaunch.com    (Summit template)
    └── [custom-domain.com]                (Custom domain via DNS)

┌─────────────────────────────────────────────────────────────────┐
│                      Hosting & Infrastructure                   │
└─────────────────────────────────────────────────────────────────┘

Vercel (Frontend & API)
├── Production Deployment (nrlaunch.com)
│   └── Environment: NODE_ENV=production
├── Preview Deployments (*.vercel.app)
│   └── For testing before production
└── Staging (optional separate project)
    └── For testing with staging data

Supabase (Database & Storage)
├── Production Project: bwftfsfbiyzgwztwtqmh
│   ├── PostgreSQL (companies, projects, news, documents, etc.)
│   └── Storage (private media bucket)
├── Staging Project: jthotkkremiesvocfsmr
│   └── For testing migrations and features
└── Backups (automated daily)
    └── 30-day retention

DNS Management (Namecheap or registrar)
├── A Record
│   ├── Name: @ (for apex domain)
│   ├── Type: A (or CNAME)
│   └── Value: Vercel IP (See Vercel setup)
├── CNAME Records
│   ├── Name: * (wildcard for subdomains)
│   └── Value: cname.vercel-dns.com
└── TXT Records
    └── For domain verification (Vercel setup)
```

---

## Adding a New Tenant

### Step 1: Create Tenant in Payload CMS

1. **Log in to Platform Admin:**
   ```
   URL: https://admin.nrlaunch.com
   Role: Platform Admin
   ```

2. **Navigate to Tenants:**
   ```
   Dashboard → Payload CMS (/cms) → [Add/Create Tenant]
   ```

3. **Fill in Tenant Information:**

   | Field | Example | Notes |
   |-------|---------|-------|
   | **Display Name** | Qelvarion Resource | Public company name |
   | **Slug** | `qelvarion-resource` | URL slug (lowercase, hyphens) |
   | **Subdomain** | `qelvarion-resource` | For nrlaunch.com subdomain routing |
   | **Custom Domain** | `qelvarion.example.com` | Optional; empty until DNS configured |
   | **Template Key** | `explorer` | `explorer` or `summit` |
   | **Ticker Symbol** | QVRN | Stock ticker (if public company) |
   | **Exchange** | TSXV | Stock exchange |
   | **Publication Status** | Published | Draft/Review/Published |

4. **Optional: Add Company Logo & Media**
   - Click **Media** section
   - Upload company logo/branding
   - Files stored in Supabase Storage bucket

### Step 2: Create Company Admin User

1. **Create User in Payload:**
   ```
   Dashboard → Payload CMS → Users → Create New User
   ```

2. **User Details:**

   | Field | Example | Notes |
   |-------|---------|-------|
   | **Email** | admin@qelvarion.example | Company admin email |
   | **Password** | [Auto-generate or set] | Share securely |
   | **Platform Role** | Leave empty | (Empty = Company Admin) |
   | **Status** | Active | Inactive to disable access |

3. **Create Tenant Membership:**
   ```
   Dashboard → Tenant Memberships → Create New
   ```

   | Field | Value | Notes |
   |-------|-------|-------|
   | **User** | [Select user created above] | Links user to tenant |
   | **Tenant** | [Select tenant] | Which company they manage |
   | **Role** | `company_admin` | Admin role for this tenant |
   | **Status** | Active | Active to grant access |

### Step 3: Send Login Credentials

Email the company admin:

```
Subject: Your Mining IR Platform Access

Hello [Company Name],

Your investor relations website is now active:

🌐 Website: https://[your-slug].nrlaunch.com
📧 Dashboard: https://admin.nrlaunch.com

Login Credentials:
- Email: [admin@company.example]
- Password: [password] (please change on first login)

Next Steps:
1. Log in to https://admin.nrlaunch.com
2. Click Dashboard → [Your Company]
3. Add your company info:
   - Logo & branding
   - Company description
   - Contact information

4. Create content:
   - Projects / Exploration assets
   - News releases
   - Management team
   - Share structure
   - Documents

5. Publish content:
   - Draft → Review → Published workflow
   - Public website updates automatically

Questions? Contact us at [support@nrlaunch.com]
```

---

## Configuring Custom Domain

Custom domains allow tenants to use their own domain (e.g., `ir.company.com`) instead of a subdomain on `nrlaunch.com`.

### Step 1: Domain Registration (Namecheap)

**If the company doesn't own the domain yet:**

1. **Go to Namecheap:** https://www.namecheap.com
2. **Search for domain** (e.g., `ir.qelvarion.com`)
3. **Purchase domain** (typically $10-15/year)
4. **Keep Namecheap as registrar** (easier management)

**If the company already owns the domain:**
- Skip to Step 2 (DNS Configuration)

---

### Step 2: Configure Vercel Domain (Vercel Dashboard)

**Prerequisite:** You must have Vercel Pro access to add custom domains.

1. **Log in to Vercel:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select the Mining IR Platform project**

3. **Go to Settings → Domains:**
   ```
   Vercel Dashboard → Project → Settings → Domains
   ```

4. **Add Domain:**
   - Click **Add Domain**
   - Enter custom domain: `ir.qelvarion.com`
   - Click **Add**

5. **Configure DNS Records** (Vercel will show required records):

   **Option A: Namecheap (Recommended for simplicity)**
   
   Go to Namecheap Domain Management:
   ```
   https://www.namecheap.com/dashboard
   → Manage Domains
   → Select domain → Advanced DNS
   ```

   Add Vercel's DNS records:

   ```
   ┌────────────────────────────────────────────────┐
   │ Namecheap Advanced DNS Configuration           │
   ├─────────────────────────────────────────────────┤
   │ Type    | Host          | Value                │
   ├─────────────────────────────────────────────────┤
   │ CNAME   | ir            | cname.vercel-dns.com │
   │ TXT     | _vercel       | [Verification code]  │
   │         |               | (from Vercel)        │
   └─────────────────────────────────────────────────┘
   ```

   **Steps in Namecheap:**
   1. Click **Advanced DNS** tab
   2. Click **Add Record**
   3. Type: `CNAME`
   4. Host: `ir`
   5. Value: `cname.vercel-dns.com`
   6. TTL: `30 min` (automatic)
   7. Click checkmark to save
   8. Repeat for TXT record if Vercel requires verification

   **Option B: Change nameservers to Vercel (Advanced)**
   - Less recommended; requires more Vercel configuration
   - Only do this if Namecheap DNS is unavailable

6. **Verify Domain in Vercel:**
   - Wait 5-10 minutes for DNS propagation
   - Vercel automatically checks and shows ✅ when verified

---

### Step 3: Update Tenant Configuration

Once domain is verified in Vercel, update the Payload CMS:

1. **Log in to Payload CMS:**
   ```
   https://admin.nrlaunch.com → /cms
   ```

2. **Find the Tenant:**
   ```
   Collections → Companies → [Search tenant name]
   ```

3. **Update Domain Field:**
   ```
   Custom Domain: ir.qelvarion.com
   ```

4. **Save and Publish**

---

### Step 4: Test Custom Domain

1. **Wait for SSL Certificate** (5-10 minutes):
   - Vercel automatically generates SSL cert via Let's Encrypt
   - No manual action needed

2. **Test in Browser:**
   ```
   https://ir.qelvarion.com
   ```
   Should show the tenant's website (same as subdomain version)

3. **Verify in Vercel Logs:**
   ```
   Vercel Dashboard → Deployments → Preview/Production
   → Look for domain in logs
   ```

---

## Deployment Workflow

### Local Development

```bash
# 1. Start local dev server
npm run dev

# 2. Local database and Payload are running
# 3. Accessible at http://localhost:3000

# 4. Use DEFAULT_TENANT_SLUG for testing
# In .env.local: DEFAULT_TENANT_SLUG=qelvarion-resource
```

**Folder Structure (Local):**

```
mining-ir-platform/
├── .env.local                    # Local config (gitignored)
│   ├── DATABASE_URI             # PostgreSQL connection
│   ├── PAYLOAD_SECRET           # Session encryption key
│   ├── DEFAULT_TENANT_SLUG      # Tenant to test locally
│   └── S3_* (optional)          # Supabase Storage config
│
├── src/
│   ├── app/(frontend)/          # Public pages & dashboard
│   │   ├── page.tsx             # Home page
│   │   ├── projects/            # Projects listing/detail
│   │   ├── news/                # News listing/detail
│   │   ├── documents/           # Document library
│   │   ├── management/          # Management team
│   │   ├── share-structure/     # Cap table
│   │   ├── admin/               # Platform admin routes
│   │   └── dashboard/           # Company admin dashboard
│   │       ├── projects/        # Add/edit projects
│   │       ├── news/            # Add/edit news
│   │       ├── documents/       # Upload documents
│   │       ├── management/      # Team management
│   │       └── share-structure/ # Capitalization table
│   │
│   ├── collections/             # Payload CMS collections
│   │   ├── Companies.ts         # Tenant company records
│   │   ├── Projects.ts          # Exploration projects
│   │   ├── NewsReleases.ts      # News & announcements
│   │   ├── Documents.ts         # PDF/presentation uploads
│   │   ├── People.ts            # Management team profiles
│   │   ├── ShareStructures.ts   # Cap table records
│   │   ├── Media.ts             # Media management
│   │   └── Users.ts             # User accounts
│   │
│   ├── lib/                     # Utility functions
│   │   ├── auth.ts              # Authentication (with cache)
│   │   ├── tenant.ts            # Tenant resolution
│   │   ├── public-data.ts       # Public API queries
│   │   ├── publishing.ts        # Draft/Review/Published workflow
│   │   └── collection-hooks.ts  # Payload hooks
│   │
│   ├── components/              # React components
│   │   ├── marketing/           # Marketing site
│   │   ├── templates/           # Presentation templates (explorer, summit)
│   │   ├── dashboard/           # Admin dashboard components
│   │   ├── public/              # Public page components
│   │   └── ui/                  # Reusable UI components
│   │
│   └── migrations/              # Payload database migrations
│       └── [timestamp]_*.ts     # Migration files
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # System design
│   ├── SECURITY.md              # Security model
│   ├── TESTING.md               # Test matrix
│   └── decisions/               # ADRs (Architecture Decision Records)
│
├── tests/                       # Test suite
│   ├── tenant-isolation.int.spec.ts
│   ├── publishing.spec.ts
│   ├── storage-privacy.spec.ts
│   └── ...
│
├── public/                      # Static assets
│   └── images/
│
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.ts               # Next.js config
└── payload.config.ts            # Payload CMS config
```

---

### Upload Custom Frontend Pages

**Override template styling for a specific tenant:**

**Option A: Via Dashboard (Easy)**

1. **Log in as Company Admin:**
   ```
   https://admin.nrlaunch.com → Dashboard
   ```

2. **Navigate to Company Settings:**
   ```
   Dashboard → Company → Advanced
   ```

3. **Upload Custom CSS/Styling** (if enabled)
   - Some SaaS platforms allow custom CSS
   - Add tenant-specific overrides
   - Deploy without code changes

**Option B: Via Code (Advanced)**

If you need to add custom pages per tenant:

1. **Add to `src/components/templates/`:**
   ```
   src/components/templates/
   ├── TenantHome.tsx          # Base home template
   ├── explorer/               # Explorer template
   │   ├── ExplorerHome.tsx
   │   └── ExplorerProject.tsx
   └── summit/                 # Summit template (color variant)
       ├── SummitHome.tsx
       └── SummitProject.tsx
   ```

2. **Modify `src/lib/templates.ts`:**
   ```typescript
   export function resolveTemplateKey(company: Company): 'explorer' | 'summit' {
     // Return template based on company.templateKey
     return company.templateKey || 'explorer'
   }
   ```

3. **Update `src/app/(frontend)/page.tsx`:**
   ```typescript
   const template = resolveTemplateKey(company)
   // Conditional render based on template
   return template === 'summit' 
     ? <SummitHome data={data} />
     : <ExplorerHome data={data} />
   ```

4. **Deploy via Vercel (see below)**

---

### Production Deployment (Vercel)

#### Prerequisites
- Vercel Pro account
- Project already connected to GitHub
- Environment variables configured

#### Deployment Process

**1. Push code to GitHub:**

```bash
git add .
git commit -m "Add custom pages for tenant"
git push origin main
```

**2. Vercel auto-deploys (if configured):**

```
GitHub webhook → Vercel → Automatic deployment
                           ↓
                    Build & test
                           ↓
                    Deploy to Production
                           ↓
                    Update nrlaunch.com
```

**3. Monitor deployment:**

```
Vercel Dashboard
├── Deployments tab
├── Click latest deployment
├── View build logs
└── Check for errors
```

**4. Verify production:**

```bash
# Test public site
https://[slug].nrlaunch.com
https://qelvarion-resource.nrlaunch.com

# Test custom domain (if configured)
https://ir.qelvarion.com

# Test admin panel
https://admin.nrlaunch.com
```

---

#### Environment Variables (Vercel)

Set in Vercel dashboard:

```
Vercel Dashboard
→ Project Settings
→ Environment Variables
```

**Production Variables:**

```
NODE_ENV                      = production
PAYLOAD_DATABASE_PUSH         = false
DATABASE_URI                  = [Supabase prod connection]
DATABASE_SSL_CA               = [PEM file content]
PAYLOAD_SECRET                = [Encryption key]
NEXT_PUBLIC_SERVER_URL        = https://nrlaunch.com
DEFAULT_TENANT_SLUG           = [NOT SET - fail-closed]
S3_BUCKET                     = media
S3_ACCESS_KEY_ID              = [Supabase key]
S3_SECRET_ACCESS_KEY          = [Supabase secret]
S3_REGION                     = us-east-1
S3_ENDPOINT                   = https://[supabase-id].supabase.co
```

**Preview Variables:**

```
NODE_ENV                      = production
PAYLOAD_DATABASE_PUSH         = false
DATABASE_URI                  = [Supabase staging connection]
DATABASE_SSL_CA               = [PEM file content]
PAYLOAD_SECRET                = [Different key than prod]
NEXT_PUBLIC_SERVER_URL        = https://[preview-domain].vercel.app
DEFAULT_TENANT_SLUG           = [Can use for testing]
S3_*                          = [Staging Supabase storage]
```

---

### Update Company Content

**Company Admin adds content via Dashboard:**

```
Flow: Draft → Review → Published

1. Admin logs in
   https://admin.nrlaunch.com
   → Selects their company
   → Dashboard

2. Navigates to content type
   Dashboard → News Releases
   Dashboard → Projects
   Dashboard → Documents
   etc.

3. Creates new content
   Click "New" or "Create"
   Fill in form fields
   Upload media if needed
   Save as Draft

4. Requests review
   (Optional: workflow to notify reviewer)
   Status: Draft → Review

5. Approver publishes
   Admin/Platform Admin approves
   Status: Review → Published

6. Public site updates
   Automatic revalidation
   Published content visible at:
   https://[slug].nrlaunch.com
   https://[custom-domain].com
```

---

## Troubleshooting

### Common Issues

#### **1. Custom domain not working**

**Problem:** 
```
https://ir.qelvarion.com shows 404 or SSL error
```

**Diagnosis:**
```bash
# 1. Check DNS propagation
nslookup ir.qelvarion.com
# Should resolve to Vercel IP

# 2. Check Vercel dashboard
Vercel → Project → Settings → Domains
# Should show ✅ Verified and SSL Active

# 3. Check Payload config
Log in to Payload CMS
→ Find tenant
→ Verify "Custom Domain" field is set
```

**Solution:**
1. Wait 5-10 minutes for DNS to propagate
2. Verify domain in Vercel shows SSL Active
3. Confirm Payload tenant record includes domain
4. Hard refresh browser (Cmd+Shift+R)
5. Check Vercel logs for errors

---

#### **2. Production database slow**

**Problem:**
```
Page load takes 5+ seconds
```

**Diagnosis:**
```bash
# Check Payload client caching
# In src/lib/auth.ts:
# Should have payloadPromise cache (already fixed)

# Check database queries
# See /docs/OPERATIONS.md for performance tips
```

**Solution:**
- Ensure Payload cache is enabled (default: ✅)
- Run `npm run check:migration-drift` to verify schema
- Add database indexes on frequently queried fields
- Use ISR (Incremental Static Regeneration) for public pages

---

#### **3. Can't log in**

**Problem:**
```
"Invalid email or password" after correct credentials
```

**Diagnosis:**
```
1. Check user status in Payload CMS
   Is user status = "Active"?

2. Check tenant membership
   Does user have company_admin role?
   Is membership status = "Active"?

3. Check session cookie
   Clear browser cookies
   Try incognito/private mode
```

**Solution:**
1. Log in as Platform Admin
2. Check user status: Settings → Users → [user] → Status = Active
3. Check membership: Settings → Tenant Memberships → [membership]
4. Clear cookies and try again

---

#### **4. Content not showing on public site**

**Problem:**
```
News/Projects/Documents added but not visible on public website
```

**Diagnosis:**
```
1. Check publication status
   Is content status = "Published"?
   (Not Draft or Review)

2. Check tenant
   Is content assigned to correct tenant?

3. Check template
   Is this content type visible in current template?
```

**Solution:**
1. Log in to Payload CMS
2. Find the content record
3. Change Status: Draft → Published
4. Save and wait 5 seconds for revalidation
5. Refresh public site

---

#### **5. Vercel deployment fails**

**Problem:**
```
Deployment shows red X or "Build failed"
```

**Diagnosis:**
```
1. Click deployment in Vercel
2. Check "Build Logs" tab
3. Look for error messages
```

**Common causes:**
- TypeScript errors: Run `npm run typecheck`
- Missing env vars: Check Vercel Environment Variables
- Payload schema issues: Run `npm run check:migration-drift`

**Solution:**
```bash
# Fix locally
npm run typecheck
npm run lint
npm test
npm run build

# Commit and push
git push origin main

# Vercel will redeploy automatically
```

---

## Quick Reference Checklist

### Adding New Tenant

- [ ] Create tenant record in Payload CMS
- [ ] Set slug, subdomain, template
- [ ] Create user account for company admin
- [ ] Create tenant membership (user → tenant)
- [ ] Send login credentials via email
- [ ] Verify company can log in
- [ ] Test public website at `https://[slug].nrlaunch.com`

### Configuring Custom Domain

- [ ] Company registers domain (or provide existing)
- [ ] Add domain to Vercel project (Settings → Domains)
- [ ] Configure Namecheap DNS (CNAME + TXT records)
- [ ] Wait for SSL verification (5-10 min)
- [ ] Update Payload tenant record with custom domain
- [ ] Test custom domain in browser
- [ ] Verify SSL certificate shows ✅

### Deploying Updates

- [ ] Test locally: `npm run dev`
- [ ] Run verification: `npm run verify`
- [ ] Commit code: `git add . && git commit -m "..."`
- [ ] Push to GitHub: `git push origin main`
- [ ] Monitor Vercel deployment
- [ ] Test production: `https://nrlaunch.com`
- [ ] Verify custom domains still work

---

## Support & Escalation

### For SaaS Operators

**Common questions:**
1. How do I add a new company? → See [Adding a New Tenant](#adding-a-new-tenant)
2. How do I set up their domain? → See [Configuring Custom Domain](#configuring-custom-domain)
3. Why is the site slow? → See [Troubleshooting](#troubleshooting)

### For Developers

**Code changes:**
- Backend changes → Update Payload collections
- Frontend changes → Update React components
- Database schema → Add migration: `npm run migrate:create`
- Deploy → Push to GitHub, Vercel auto-deploys

### For End Users (Company Admins)

**Support portal:** https://admin.nrlaunch.com/help
**Email:** support@nrlaunch.com
**Status:** https://status.nrlaunch.com (Vercel status)

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Security Model](./SECURITY.md)
- [Testing Guide](./TESTING.md)
- [ADRs - Architecture Decisions](./decisions/)
- [Deployment Guides](./decisions/ADR-0020-production-readiness-gates-before-investor-features.md)
