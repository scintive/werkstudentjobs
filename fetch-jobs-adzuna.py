#!/usr/bin/env python3
"""
Fetch jobs from Adzuna API (Free, no scraping needed)
Sign up: https://developer.adzuna.com/
"""

import requests
import json
from datetime import datetime

print("=" * 60)
print("🚀 ADZUNA JOB FETCHER - Starting...")
print("=" * 60)

# Adzuna API Configuration (FREE - Sign up at developer.adzuna.com)
ADZUNA_APP_ID = "YOUR_APP_ID_HERE"  # Get free at developer.adzuna.com
ADZUNA_API_KEY = "YOUR_API_KEY_HERE"  # Get free at developer.adzuna.com

API_ENDPOINT = "https://werkstudentjobs.com/api/jobs/import-jobspy"

print("\n⚠️  NOTE: You need free Adzuna API credentials")
print("📝 Sign up at: https://developer.adzuna.com/")
print("   Then replace YOUR_APP_ID_HERE and YOUR_API_KEY_HERE in this script\n")

if ADZUNA_APP_ID == "YOUR_APP_ID_HERE":
    print("❌ Please configure your Adzuna API credentials first!")
    print("   Edit fetch-jobs-adzuna.py and add your app_id and api_key")
    exit(1)

print(f"📊 Fetching werkstudent jobs from Adzuna (Germany)...")

try:
    all_jobs = []
    pages_to_fetch = 5  # ~100 jobs (20 per page)
    
    for page in range(1, pages_to_fetch + 1):
        print(f"  Fetching page {page}/{pages_to_fetch}...")
        
        response = requests.get(
            f"https://api.adzuna.com/v1/api/jobs/de/search/{page}",
            params={
                "app_id": ADZUNA_APP_ID,
                "app_key": ADZUNA_API_KEY,
                "what": "werkstudent",
                "results_per_page": 20,
                "sort_by": "date"
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Adzuna API Error: {response.status_code}")
            print(response.text)
            break
        
        data = response.json()
        jobs = data.get("results", [])
        
        for job in jobs:
            all_jobs.append({
                "title": job.get("title", ""),
                "company": job.get("company", {}).get("display_name", ""),
                "location": job.get("location", {}).get("display_name", ""),
                "description": job.get("description", ""),
                "date_posted": job.get("created", ""),
                "job_url": job.get("redirect_url", ""),
                "job_type": job.get("contract_type", ""),
                "salary_min": job.get("salary_min", None),
                "salary_max": job.get("salary_max", None),
                "salary_interval": "yearly" if job.get("salary_min") else "",
                "site": "adzuna",
                "company_url": "",
                "company_logo": ""
            })
        
        print(f"    ✅ Got {len(jobs)} jobs")
    
    print(f"\n✅ Total fetched: {len(all_jobs)} jobs")
    
    if len(all_jobs) == 0:
        print("❌ No jobs found. Exiting...")
        exit(1)
    
    # Save backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"werkstudent_jobs_adzuna_{timestamp}.json", "w") as f:
        json.dump(all_jobs, f, indent=2)
    print(f"💾 Saved backup to: werkstudent_jobs_adzuna_{timestamp}.json")
    
    print(f"\n🔄 Sending {len(all_jobs)} jobs to Vercel API for processing...")
    print(f"📍 Endpoint: {API_ENDPOINT}")
    print("\n⏳ This will take several minutes...")
    print("=" * 60)
    
    # Send to Vercel API
    response = requests.post(
        API_ENDPOINT,
        json={"jobs": all_jobs},
        headers={"Content-Type": "application/json"},
        timeout=600
    )
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
        print(f"📊 Processed: {result.get('processed', 0)} jobs")
        print(f"❌ Failed: {result.get('failed', 0)} jobs")
        print("\n🎉 Check your dashboard for new jobs!")
        print("=" * 60)
    else:
        print(f"\n❌ API Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

