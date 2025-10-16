#!/usr/bin/env python3
"""
Batched Job Fetcher - Processes jobs in chunks to avoid timeout
"""

from jobspy import scrape_jobs
import pandas as pd
import requests
import json
from datetime import datetime
import time

print("=" * 60)
print("🚀 BATCHED JOB FETCHER - Starting...")
print("=" * 60)

# Configuration
RESULTS_WANTED = 100
BATCH_SIZE = 10  # Process 10 jobs at a time
API_ENDPOINT = "https://werkstudentjobs.com/api/jobs/import-jobspy"

print(f"\n📊 Scraping {RESULTS_WANTED} werkstudent jobs from Indeed...")

try:
    jobs = scrape_jobs(
        site_name=["indeed"],
        search_term="werkstudent",
        location="Germany",
        results_wanted=RESULTS_WANTED,
        hours_old=72,  # Last 3 days
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
    
    # Process in batches
    total_jobs = len(jobs_data)
    total_batches = (total_jobs + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\n🔄 Processing {total_jobs} jobs in {total_batches} batches of {BATCH_SIZE}...")
    print(f"📍 Endpoint: {API_ENDPOINT}")
    print("\n" + "=" * 60)
    
    total_processed = 0
    total_failed = 0
    
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, total_jobs)
        batch = jobs_data[start_idx:end_idx]
        
        print(f"\n📦 Batch {batch_num + 1}/{total_batches} - Processing jobs {start_idx + 1}-{end_idx}...")
        
        try:
            response = requests.post(
                API_ENDPOINT,
                json={"jobs": batch},
                headers={"Content-Type": "application/json"},
                timeout=300  # 5 minutes per batch
            )
            
            if response.status_code == 200:
                result = response.json()
                batch_processed = result.get('processed', 0)
                batch_failed = result.get('failed', 0)
                
                total_processed += batch_processed
                total_failed += batch_failed
                
                print(f"   ✅ Processed: {batch_processed}, Failed: {batch_failed}")
                
                # Show progress
                progress = ((batch_num + 1) / total_batches) * 100
                print(f"   📊 Overall progress: {progress:.0f}% ({total_processed}/{total_jobs} jobs)")
                
            else:
                print(f"   ❌ API Error: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                total_failed += len(batch)
            
            # Small delay between batches to avoid rate limits
            if batch_num < total_batches - 1:
                print(f"   ⏸️  Waiting 2 seconds before next batch...")
                time.sleep(2)
                
        except Exception as e:
            print(f"   ❌ Batch error: {str(e)}")
            total_failed += len(batch)
    
    # Final summary
    print("\n" + "=" * 60)
    print("✅ JOB IMPORT COMPLETE!")
    print("=" * 60)
    print(f"📊 Total jobs scraped: {total_jobs}")
    print(f"✅ Successfully processed: {total_processed}")
    print(f"❌ Failed: {total_failed}")
    print(f"📈 Success rate: {(total_processed/total_jobs*100):.1f}%")
    print("\n🎉 Check your dashboard for new jobs!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    exit(1)

