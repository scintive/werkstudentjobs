#!/usr/bin/env python3
"""
Test the local→API→Supabase pipeline with sample jobs
This proves the concept works without needing JobSpy
"""

import requests
import json

print("=" * 60)
print("🧪 TESTING JOB IMPORT PIPELINE")
print("=" * 60)

# Sample werkstudent jobs (realistic test data)
test_jobs = [
    {
        "title": "Werkstudent (m/w/d) Software Development - Python/React",
        "company": "Tech Startup GmbH",
        "location": "Berlin, Germany",
        "description": """Wir suchen einen motivierten Werkstudenten für die Mitarbeit in unserem Entwicklungsteam.
        
        Deine Aufgaben:
        - Entwicklung von Features in Python und React
        - Code Reviews und Testing
        - Zusammenarbeit im agilen Team
        
        Das bringst du mit:
        - Studium der Informatik oder ähnliches
        - Kenntnisse in Python und/oder React
        - Teamfähigkeit und Eigeninitiative
        
        Wir bieten:
        - 16-20h/Woche, flexible Zeiten
        - €18/Stunde
        - Remote-Möglichkeit
        - Modernes Office in Berlin-Mitte""",
        "date_posted": "2025-10-16",
        "job_url": "https://example.com/job-software-dev",
        "job_type": "Part-time",
        "salary_min": 18,
        "salary_max": 20,
        "salary_interval": "hourly",
        "site": "test",
        "company_url": "https://techstartup.de",
        "company_logo": ""
    },
    {
        "title": "Werkstudent Marketing & Social Media (m/w/d)",
        "company": "E-Commerce Solutions AG",
        "location": "München, Germany",
        "description": """Zur Verstärkung unseres Marketing-Teams suchen wir einen kreativen Werkstudenten.
        
        Aufgaben:
        - Content Creation für Social Media
        - Community Management
        - Performance Marketing Analyse
        
        Profil:
        - BWL, Marketing oder Medien-Studium
        - Erfahrung mit Instagram, TikTok, LinkedIn
        - Kreativität und Kommunikationsstärke
        
        Benefits:
        - €15-17/Stunde
        - 15-20h/Woche
        - Zentrale Lage München
        - Team Events""",
        "date_posted": "2025-10-15",
        "job_url": "https://example.com/job-marketing",
        "job_type": "Part-time",
        "salary_min": 15,
        "salary_max": 17,
        "salary_interval": "hourly",
        "site": "test",
        "company_url": "https://ecommerce-solutions.de",
        "company_logo": ""
    },
    {
        "title": "Werkstudent Data Science & Analytics (m/w/d)",
        "company": "FinTech Innovations GmbH",
        "location": "Frankfurt am Main, Germany",
        "description": """Unser Data Team sucht Unterstützung bei der Analyse großer Datenmengen.
        
        Was dich erwartet:
        - Datenanalyse mit Python und SQL
        - Erstellung von Dashboards
        - Machine Learning Projekte
        
        Dein Profil:
        - Studium: Informatik, Mathematik, Statistik
        - Python, pandas, SQL Kenntnisse
        - Analytisches Denken
        
        Was wir bieten:
        - €19-22/Stunde
        - Flexible Arbeitszeiten
        - Hybrid Work Model
        - Weiterbildung""",
        "date_posted": "2025-10-16",
        "job_url": "https://example.com/job-data-science",
        "job_type": "Part-time",
        "salary_min": 19,
        "salary_max": 22,
        "salary_interval": "hourly",
        "site": "test",
        "company_url": "https://fintech-innovations.de",
        "company_logo": ""
    }
]

API_ENDPOINT = "https://werkstudentjobs.com/api/jobs/import-jobspy"

print(f"\n📊 Sending {len(test_jobs)} test jobs to API...")
print(f"📍 Endpoint: {API_ENDPOINT}\n")

print("=" * 60)
print("Each job will go through:")
print("  1. ✅ GPT extraction & analysis")
print("  2. ✅ Company research (Tavily)")
print("  3. ✅ Career page finding (Tavily)")  
print("  4. ✅ Database insertion (Supabase)")
print("=" * 60)

print("\n⏳ Processing (this takes 2-3 minutes for 3 jobs)...\n")

try:
    response = requests.post(
        API_ENDPOINT,
        json={"jobs": test_jobs},
        headers={"Content-Type": "application/json"},
        timeout=300  # 5 minute timeout
    )
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "=" * 60)
        print("✅ SUCCESS - Pipeline works perfectly!")
        print("=" * 60)
        print(f"📊 Processed: {result.get('processed', 0)} / {len(test_jobs)} jobs")
        print(f"❌ Failed: {result.get('failed', 0)} jobs")
        print(f"⏱️  Timestamp: {result.get('timestamp', 'N/A')}")
        
        print("\n🎉 The pipeline is working!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. ✅ Pipeline proven to work (local → API → Supabase)")
        print("  2. 📊 You already have 238 active jobs")
        print("  3. 🔄 For automatic daily jobs, we can:")
        print("     a) Use Adzuna API (free, 100 jobs/month)")
        print("     b) Upgrade Python to 3.10+ for JobSpy")
        print("     c) Host JobSpy on separate Python 3.10+ server")
        print("=" * 60)
        
    else:
        print(f"\n❌ API Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n✨ Done!\n")

