# Deployment Guide - Vercel Production

This guide covers deploying the WerkStudentJobs application to Vercel with automated job fetching.

## Prerequisites

- Vercel account with project configured
- Supabase project (production)
- API keys for external services

## Required Environment Variables

### Essential Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration (for GPT pipeline)
OPENAI_API_KEY=sk-your-openai-key-here

# Apify Configuration (for job scraping)
APIFY_API_KEY=your_apify_key_here

# Cron Job Security
CRON_SECRET=your_secure_random_string_here

# Base URL (for internal API calls)
NEXT_PUBLIC_BASE_URL=https://werkstudentjobs.com
```

### Optional Variables

```bash
# Port (only for local development)
PORT=3000

# Auto-confirm emails (only for development)
# SUPABASE_SERVICE_ROLE_KEY - if set, enables auto-confirm
```

## Setting Up Environment Variables in Vercel

### Via Vercel Dashboard

1. Go to your project settings: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
2. Add each variable:
   - **Key**: Variable name (e.g., `OPENAI_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select `Production`, `Preview`, and `Development` as needed
3. Click "Save"

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add APIFY_API_KEY production
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_BASE_URL production
```

## Generating CRON_SECRET

Generate a secure random string for cron authentication:

```bash
# Using OpenSSL (Mac/Linux)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Example output: "8Jf2k9Lm4Np7Qr5St8Uv3Wx6Yz1Ab4Cd7Ef0=="
```

## Automated Job Fetching

### How It Works

The application uses Vercel Cron Jobs to automatically fetch new Werkstudent positions every 4 hours.

**Pipeline:**
1. Vercel Cron calls `/api/cron/fetch-jobs` (every 4 hours)
2. Endpoint delegates to `/api/jobs/scrape-latest`
3. Scrapes jobs from LinkedIn, Indeed, StepStone (via Apify)
4. Each job is processed through GPT pipeline
5. Companies are created/updated in database
6. New jobs are inserted into Supabase

**Configuration:**
- Schedule: `0 */4 * * *` (every 4 hours, on the hour)
- Defined in: `vercel.json`
- Protected by: `CRON_SECRET` environment variable

### Monitoring Cron Jobs

#### Via Vercel Dashboard

1. Go to: https://vercel.com/[your-team]/[your-project]/logs
2. Filter by: `/api/cron/fetch-jobs`
3. Look for:
   - `🕐 CRON JOB STARTED`
   - `✅ CRON JOB COMPLETED`
   - Stats: `X processed, Y skipped, Z failed`

#### Via Supabase

1. Check the `jobs` table for new entries
2. Look at `created_at` timestamps
3. Verify `source` field (linkedin, indeed, stepstone)

#### Manual Testing

Test the cron endpoint manually:

```bash
curl -X GET https://werkstudentjobs.com/api/cron/fetch-jobs \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Cron job completed successfully",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "totalScraped": 30,
  "processed": 15,
  "failed": 0,
  "jobs": [...]
}
```

## Deployment Steps

### 1. Initial Deployment

```bash
# Clone repository (if not already)
git clone https://github.com/your-org/werkstudentjobs.git
cd werkstudentjobs

# Install dependencies
npm install

# Link to Vercel project
vercel link

# Deploy to production
vercel --prod
```

### 2. Verify Deployment

1. **Check deployment status:**
   - Visit: https://vercel.com/[your-team]/[your-project]
   - Status should be "Ready"

2. **Test the application:**
   - Visit: https://werkstudentjobs.com
   - Sign up / Log in
   - Upload a resume
   - Browse jobs

3. **Verify cron job:**
   - Wait for next scheduled run (check Vercel logs)
   - Or manually trigger via curl (see above)

### 3. Configure Email Templates

**Important**: Set up professional email templates in Supabase before users can sign up.

1. **Go to Supabase Email Templates**:
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates
   - Or navigate: Project → Authentication → Email Templates

2. **Configure "Confirm signup" Template**:
   - Subject: `Confirm Your Email - WerkStudentJobs`
   - Copy contents from `email-templates/confirmation-email.html`
   - Paste into "Message (Body)" field
   - Save changes

3. **Configure Email Settings**:
   - From Email: `noreply@werkstudentjobs.com` (or your verified domain)
   - From Name: `WerkStudentJobs`
   - Enable email confirmations: ✅

4. **Test Email**:
   - Sign up with a test account
   - Verify email arrives with correct branding
   - Check logo loads correctly
   - Test confirmation link works

📝 **See `email-templates/README.md` for detailed instructions**

### 4. Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] CRON_SECRET is configured
- [ ] Supabase connection works
- [ ] OpenAI API calls succeed
- [ ] JobSpy scraping works (Python 3 installed)
- [ ] Cron job runs successfully
- [ ] No errors in Vercel logs
- [ ] Database has new jobs appearing
- [ ] Email templates configured in Supabase
- [ ] Test email sent and received with correct branding
- [ ] Logo displays correctly in emails
- [ ] Impressum page filled with actual company info
- [ ] Privacy policy (Datenschutzerklärung) complete

## Troubleshooting

### Cron Job Not Running

**Symptoms:** No new jobs appearing after 4 hours

**Solutions:**
1. Check Vercel logs for cron execution
2. Verify `vercel.json` is in root directory
3. Ensure `CRON_SECRET` is set in environment
4. Check Apify API key validity
5. Verify Supabase service role key permissions

### Unauthorized Cron Errors

**Error:** `❌ Unauthorized cron request`

**Solutions:**
1. Verify `CRON_SECRET` matches in:
   - Vercel environment variables
   - Request Authorization header
2. Check logs for actual error message
3. Regenerate secret if compromised

### Job Scraping Fails

**Error:** `❌ Failed to process job`

**Solutions:**
1. Check Apify API key and quota
2. Verify Apify actor names are correct
3. Check OpenAI API key and quota
4. Review Supabase permissions (service role)
5. Check individual source errors in logs

### Database Insert Errors

**Error:** `❌ Failed to insert job`

**Solutions:**
1. Verify Supabase service role key
2. Check database schema matches code
3. Review Row Level Security (RLS) policies
4. Ensure company is created before job
5. Check for duplicate URLs

## Updating the Application

### Deploy Code Changes

```bash
# Commit changes
git add .
git commit -m "Your changes"
git push origin main

# Automatic deployment
# Vercel will auto-deploy on push to main branch

# Or manual deployment
vercel --prod
```

### Update Environment Variables

```bash
# Update a variable
vercel env rm CRON_SECRET production
vercel env add CRON_SECRET production

# Or use dashboard: vercel.com/[project]/settings/environment-variables
```

### Modify Cron Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-jobs",
      "schedule": "0 */4 * * *"  // Change this
    }
  ]
}
```

**Common schedules:**
- Every 2 hours: `0 */2 * * *`
- Every 4 hours: `0 */4 * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at 9 AM: `0 9 * * *`
- Twice daily: `0 9,17 * * *`

Then redeploy:
```bash
vercel --prod
```

## Cost Considerations

### Vercel
- **Hobby Plan:** 100 GB-hours compute/month (free)
- **Cron Jobs:** Included in compute hours
- **Estimate:** ~10-15 minutes per cron run = ~3 hours/day

### Apify
- **Free Tier:** $5 credit/month
- **LinkedIn Scraper:** ~$0.15 per 10 jobs
- **Indeed Scraper:** ~$0.10 per 10 jobs
- **StepStone Scraper:** ~$0.10 per 10 jobs
- **Total per run:** ~$0.35 (30 jobs total)
- **Monthly cost:** ~$2.52 (6 runs/day × 30 days)

### OpenAI
- **GPT-4o:** ~$0.005 per job
- **Per run:** ~$0.15 (30 jobs)
- **Monthly cost:** ~$27 (6 runs/day × 30 days)

### Supabase
- **Free Tier:** 500 MB database, 2 GB bandwidth
- **Estimate:** Sufficient for testing/small scale
- **Pro Plan:** $25/month (if needed)

**Total Monthly Cost (Testing):** ~$30-35

## Security Best Practices

1. **Never commit secrets:**
   - Add `.env.local` to `.gitignore`
   - Use Vercel environment variables

2. **Rotate secrets regularly:**
   - CRON_SECRET every 90 days
   - API keys every 180 days

3. **Use least privilege:**
   - Supabase: Use service role only for cron
   - Apify: Create read-only token if possible

4. **Monitor usage:**
   - Set up Vercel usage alerts
   - Monitor Apify credit consumption
   - Track OpenAI API spending

5. **Enable Supabase RLS:**
   - Protect user data
   - Restrict anonymous access
   - Audit policies regularly

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Apify Docs:** https://docs.apify.com
- **Next.js Docs:** https://nextjs.org/docs

## Rollback Procedure

If deployment fails or has critical bugs:

```bash
# Via Vercel Dashboard
1. Go to: vercel.com/[project]/deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

# Via Vercel CLI
vercel rollback
```
