# Job Scraping with Apify

This system automatically scrapes the latest Werkstudent and Internship jobs from multiple German job boards using Apify actors.

## Supported Job Boards

1. **LinkedIn** - `curious_coder/linkedin-jobs-search-scraper`
2. **Indeed Germany** - `curious_coder/indeed-scraper`
3. **StepStone** - `easyapi/stepstone-jobs-scraper`
4. **XING** - `easyapi/xing-jobs-scraper` (coming soon)
5. **Bundesagentur für Arbeit** - German Federal Employment Agency (coming soon)

## Setup

### 1. Get Apify API Key

1. Sign up at [Apify](https://apify.com/)
2. Go to [Integrations](https://console.apify.com/account/integrations)
3. Copy your API token

### 2. Add to Environment Variables

Add to your `.env.local`:

```bash
APIFY_API_KEY=your_apify_api_key_here
```

## Usage

### API Endpoint

**POST** `/api/jobs/scrape-latest`

Scrapes jobs from all sources and processes them through the GPT pipeline.

#### Request Body (Optional)

```json
{
  "keywords": ["Werkstudent", "Internship", "Praktikum"],
  "limitPerSource": 5
}
```

#### Response

```json
{
  "success": true,
  "message": "Scraped and processed 12 jobs",
  "totalScraped": 15,
  "processed": 12,
  "failed": 3,
  "jobs": [
    {
      "id": "uuid",
      "title": "Werkstudent Software Development",
      "company": "Example GmbH",
      "source": "linkedin"
    }
  ],
  "failedJobs": [
    {
      "title": "Some Job",
      "company": "Some Company",
      "error": "Error message"
    }
  ]
}
```

### Get Scraping Status

**GET** `/api/jobs/scrape-latest`

Returns recently scraped jobs and statistics.

#### Response

```json
{
  "success": true,
  "recentJobs": [...],
  "jobsBySource": {
    "linkedin": 5,
    "indeed": 4,
    "stepstone": 3
  },
  "totalRecentJobs": 12
}
```

## How It Works

### 1. Scraping Phase

The system uses Apify actors to scrape jobs from each source:

- **LinkedIn**: Searches for keywords with Boolean OR logic
- **Indeed**: Builds search URLs for indeed.de with German proxy
- **StepStone**: Searches stepstone.de with filters

Each actor runs in parallel and returns structured job data.

### 2. Processing Phase

For each scraped job:

1. **GPT Parsing** - Uses `parseJobInfoOnly()` to extract:
   - Normalized requirements, responsibilities, qualifications
   - Skills, employment type, work mode
   - Location details

2. **Company Research** - Uses `smartCompanyResearch()` to:
   - Check if GPT has confident knowledge of the company
   - Optionally search the web if confidence is low
   - Extract company details (industry, size, website, logo)

3. **Database Insertion**:
   - Creates company if it doesn't exist
   - Checks for duplicate jobs (by URL or title+company)
   - Inserts job with all normalized data

### 3. Cost Optimization

The system is optimized to minimize API costs:

- Uses `parseJobInfoOnly()` instead of full extraction
- Smart company research only searches web when needed
- Skips duplicate jobs
- Processes jobs sequentially to avoid rate limits

## Testing

### Quick Test (5 jobs)

```bash
curl -X POST http://localhost:3000/api/jobs/scrape-latest \
  -H "Content-Type: application/json" \
  -d '{"limitPerSource": 2}'
```

This will scrape 2 jobs from each source (6-10 total jobs).

### Check Recent Scrapes

```bash
curl http://localhost:3000/api/jobs/scrape-latest
```

## Costs

### Apify Costs

Apify offers a free tier with:
- $5 free platform credits per month
- Access to all actors

Each actor run typically costs:
- LinkedIn: ~$0.01-0.05 per 5 jobs
- Indeed: ~$0.01-0.03 per 5 jobs
- StepStone: ~$0.01-0.03 per 5 jobs

### OpenAI Costs

Per job processing:
- `parseJobInfoOnly()`: ~$0.01-0.02
- `smartCompanyResearch()`: ~$0.005-0.03 (depending on if web search is needed)

**Total**: ~$0.015-0.05 per job

For 15 jobs (5 per source × 3 sources): **~$0.23-0.75**

## Scheduling

To automatically scrape jobs daily, you can:

1. **Use Vercel Cron** (if deployed on Vercel):
   - Add to `vercel.json`
   - Configure cron expression

2. **Use External Cron Service**:
   - [cron-job.org](https://cron-job.org)
   - [EasyCron](https://www.easycron.com)
   - Setup to POST to your endpoint daily

3. **Use Apify Schedules**:
   - Schedule actors directly in Apify Console
   - Use webhooks to trigger your API

## Troubleshooting

### "APIFY_API_KEY is not set"

Make sure you added `APIFY_API_KEY` to `.env.local` and restarted the dev server.

### "Actor run FAILED"

Some actors may fail due to:
- Website changes (scraper needs update)
- Rate limiting
- Proxy issues

The API will continue processing other sources and report failures.

### Jobs not appearing

Check:
1. Database connection is working
2. Jobs aren't duplicates (check by URL)
3. Review API response for errors

### High costs

Reduce `limitPerSource` to scrape fewer jobs per source.

## Future Enhancements

- [ ] Add XING and Bundesagentur scrapers
- [ ] Implement intelligent deduplication
- [ ] Add job quality scoring
- [ ] Cache company research to reduce costs
- [ ] Add webhook support for real-time scraping
- [ ] Implement batch processing for large scrapes
