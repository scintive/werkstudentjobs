import { NextRequest, NextResponse } from 'next/server';
import { fastMatchingService } from '@/lib/services/fastMatchingService';
import type { JobWithCompany } from '@/lib/supabase/types';
import type { UserProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // DEBUG: Log RAW request body immediately after parsing
    console.log('🔥 RAW POST BODY RECEIVED:', {
      hasUserProfile: !!body.userProfile,
      hasJobs: !!body.jobs,
      jobsIsArray: Array.isArray(body.jobs),
      jobsLength: Array.isArray(body.jobs) ? body.jobs.length : 'NOT ARRAY',
      firstJobKeys: body.jobs?.[0] ? Object.keys(body.jobs[0]) : 'NO FIRST JOB',
      firstJobId: body.jobs?.[0]?.id,
      firstJobTitle: body.jobs?.[0]?.title,
      firstJobHasSkills: !!body.jobs?.[0]?.skills,
      firstJobSkillsType: body.jobs?.[0]?.skills ? (Array.isArray(body.jobs[0].skills) ? 'array' : typeof body.jobs[0].skills) : 'undefined',
      firstJobSkillsCount: Array.isArray(body.jobs?.[0]?.skills) ? body.jobs[0].skills.length : 'NOT ARRAY',
      firstJobSkillsSample: Array.isArray(body.jobs?.[0]?.skills) ? body.jobs[0].skills.slice(0, 3) : body.jobs?.[0]?.skills
    });

    const { userProfile, jobs } = body;

    if (!userProfile || !jobs || !Array.isArray(jobs)) {
      console.error('🎯 ERROR: Invalid request - missing userProfile or jobs');
      return NextResponse.json(
        { error: 'Invalid request: userProfile and jobs array are required' },
        { status: 400 }
      );
    }

    if (jobs.length === 0) {
      return NextResponse.json({ matchedJobs: [] });
    }

    console.log('🎯 Starting FAST matching for', jobs.length, 'jobs');
    console.log('🎯 User Profile DEBUG:', {
      hasSkills: !!userProfile.skills,
      skillCategories: userProfile.skills ? Object.keys(userProfile.skills) : [],
      totalSkills: userProfile.skills ? Object.values(userProfile.skills).flat().length : 0,
      hasLanguages: !!userProfile.languages,
      hasExperience: !!userProfile.experience,
      experienceCount: Array.isArray(userProfile.experience) ? userProfile.experience.length : 0
    });
    console.log('🎯 Sample Job DEBUG:', {
      firstJobTitle: jobs[0]?.title,
      firstJobSkillsCount: jobs[0]?.skills?.length || 0,
      firstJobSkills: jobs[0]?.skills?.slice(0, 5)
    });
    console.log('🎯 Research-based Weights: Skills 50%, Tools 20%, Experience 15%, Language 10%, Location 5%');
    
    // Use the fast matching service with TF-IDF and cosine similarity
    const matchedJobsWithDetails = await fastMatchingService.calculateBatchMatches(jobs, userProfile);

    // Optional debug instrumentation (single-line JSON)
    if (process.env.NEXT_PUBLIC_MATCH_DEBUG === '1') {
      try {
        const sample = matchedJobsWithDetails[0];
        const dbg = {
          kind: 'match.debug',
          jobs: jobs.length,
          userSkillCats: userProfile?.skills ? Object.keys(userProfile.skills) : [],
          sample: sample ? {
            id: sample.id,
            score: sample.match_score,
            skillsMatched: sample.matchCalculation?.skillsOverlap?.matched?.length || 0,
            toolsMatched: sample.matchCalculation?.toolsOverlap?.matched?.length || 0
          } : null
        };
         
        console.log(JSON.stringify(dbg));
      } catch {}
    }
    
    console.log('🎯 Matching complete. Top 3 matches:',
      matchedJobsWithDetails.slice(0, 3).map(j => 
        `${j.title}: ${j.match_score}% (Skills: ${Math.round(j.matchCalculation?.skillsOverlap?.score * 100 || 0)}%)`
      ).join(', ')
    );
    
    // Extract detailed explanations for top matches
    const topMatchExplanations = matchedJobsWithDetails.slice(0, 5).map(job => ({
      jobId: job.id,
      jobTitle: job.title,
      matchScore: job.match_score,
      breakdown: {
        skills: {
          score: Math.round((job.matchCalculation?.skillsOverlap?.score || 0) * 100),
          matched: job.matchCalculation?.skillsOverlap?.matched || [],
          missing: job.matchCalculation?.skillsOverlap?.missing || []
        },
        tools: {
          score: Math.round((job.matchCalculation?.toolsOverlap?.score || 0) * 100),
          matched: job.matchCalculation?.toolsOverlap?.matched || [],
          missing: job.matchCalculation?.toolsOverlap?.missing || []
        },
        language: {
          score: Math.round((job.matchCalculation?.languageFit?.score || 0) * 100),
          explanation: job.matchCalculation?.languageFit?.explanation || 'Unknown'
        },
        location: {
          score: Math.round((job.matchCalculation?.locationFit?.score || 0) * 100),
          explanation: job.matchCalculation?.locationFit?.explanation || 'Unknown'
        }
      }
    }));
    
    return NextResponse.json({
      success: true,
      matchedJobs: matchedJobsWithDetails,
      algorithm: 'fast-tfidf-cosine-similarity',
      weights: {
        skills: '50%',
        tools: '20%',
        experience: '15%', 
        language: '10%',
        location: '5%'
      },
      topMatchExplanations,
      totalJobs: jobs.length,
      averageScore: Math.round(matchedJobsWithDetails.reduce((sum, job) => sum + (job.match_score || 0), 0) / matchedJobsWithDetails.length),
      processingTime: Date.now()
    });
    
  } catch (error) {
    console.error('🎯 Fast matching service error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Job matching service temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        algorithm: 'fast-tfidf-cosine-similarity',
        retryable: true
      }, 
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
