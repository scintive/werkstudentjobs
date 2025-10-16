#!/usr/bin/env python3
"""
Local Job Fetcher - Runs JobSpy and sends results to Vercel API
This bypasses Vercel's Python limitation by running locally
"""

from jobspy import scrape_jobs
import pandas as pd
import requests
import json
from datetime import datetime

print("=" * 60)
print("🚀 LOCAL JOB FETCHER - Starting...")
print("=" * 60)

# Configuration
RESULTS_WANTED = 100
API_ENDPOINT = "https://werkstudentjobs.com/api/jobs/import-jobspy"

print(f"\n📊 Scraping {RESULTS_WANTED} werkstudent jobs from Indeed...")

# Scrape jobs using JobSpy
try:
    jobs = scrape_jobs(
        site_name=["indeed"],
        search_term="werkstudent",
        location="Germany",
        results_wanted=RESULTS_WANTED,
        hours_old=72,  # Last 3 days to get fresh jobs
        country_indeed="germany"
    )
    
    print(f"✅ Found {len(jobs)} jobs from Indeed")
    
    if len(jobs) == 0:
        print("❌ No jobs found. Exiting...")
        exit(1)
    
    # Save to CSV for backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"werkstudent_jobs_{timestamp}.csv"
    jobs.to_csv(csv_filename, index=False)
    print(f"💾 Saved backup to: {csv_filename}")
    
    # Convert to API format
    jobs_data = []
    for _, job in jobs.iterrows():
        jobs_data.append({
            "title": str(job.get("title", "")),
            "company": str(job.get("company", "")),
            "location": str(job.get("location", "")),
            "description": str(job.get("description", "")),
            "date_posted": str(job.get("date_posted", "")),
            "job_url": str(job.get("job_url", "") or job.get("job_url_direct", "")),
            "job_type": str(job.get("job_type", "")),
            "salary_min": job.get("min_amount", None),
            "salary_max": job.get("max_amount", None),
            "salary_interval": str(job.get("interval", "") if pd.notna(job.get("interval")) else ""),
            "site": str(job.get("site", "")),
            "company_url": str(job.get("company_url", "") or job.get("company_url_direct", "") if pd.notna(job.get("company_url")) else ""),
            "company_logo": str(job.get("company_logo", "") if pd.notna(job.get("company_logo")) else "")
        })
    
    print(f"\n🔄 Sending {len(jobs_data)} jobs to Vercel API for processing...")
    print(f"📍 Endpoint: {API_ENDPOINT}")
    print("\n⏳ This will take several minutes as each job goes through:")
    print("   1. GPT extraction & analysis")
    print("   2. Company research (Tavily)")
    print("   3. Career page finding (Tavily)")
    print("   4. Database insertion")
    print("\n" + "=" * 60)
    
    # Send to Vercel API
    response = requests.post(
        API_ENDPOINT,
        json={"jobs": jobs_data},
        headers={"Content-Type": "application/json"},
        timeout=600  # 10 minute timeout (processing 100 jobs takes time)
    )
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "=" * 60)
        print("✅ SUCCESS - Jobs imported successfully!")
        print("=" * 60)
        print(f"📊 Processed: {result.get('processed', 0)} jobs")
        print(f"❌ Failed: {result.get('failed', 0)} jobs")
        print(f"⏱️  Time: {result.get('timestamp', 'N/A')}")
        
        if result.get('failed', 0) > 0 and 'failures' in result:
            print(f"\n⚠️  Failed jobs (first 5):")
            for failure in result['failures'][:5]:
                print(f"   - {failure.get('title', 'N/A')}: {failure.get('error', 'Unknown error')}")
        
        print("\n🎉 All done! Check your dashboard for new jobs.")
        print("=" * 60)
        
    else:
        print(f"\n❌ API Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        exit(1)
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    exit(1)

