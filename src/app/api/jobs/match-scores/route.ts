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
        const matchCalc = sample?.matchCalculation as Record<string, unknown> | undefined;
        const skillsOverlap = matchCalc?.skillsOverlap as Record<string, unknown> | undefined;
        const toolsOverlap = matchCalc?.toolsOverlap as Record<string, unknown> | undefined;
        const dbg = {
          kind: 'match.debug',
          jobs: jobs.length,
          userSkillCats: userProfile?.skills ? Object.keys(userProfile.skills) : [],
          sample: sample ? {
            id: sample.id,
            score: sample.match_score,
            skillsMatched: (skillsOverlap?.matched as unknown[] | undefined)?.length || 0,
            toolsMatched: (toolsOverlap?.matched as unknown[] | undefined)?.length || 0
          } : null
        };

        console.log(JSON.stringify(dbg));
      } catch {}
    }
    
    console.log('🎯 Matching complete. Top 3 matches:',
      matchedJobsWithDetails.slice(0, 3).map(j => {
        const matchCalc = j.matchCalculation as Record<string, unknown> | undefined;
        const skillsOverlap = matchCalc?.skillsOverlap as Record<string, unknown> | undefined;
        const skillScore = Math.round((skillsOverlap?.score as number | undefined || 0) * 100);
        return `${j.title}: ${j.match_score}% (Skills: ${skillScore}%)`;
      }).join(', ')
    );
    
    // Extract detailed explanations for top matches
    const topMatchExplanations = matchedJobsWithDetails.slice(0, 5).map(job => {
      const matchCalc = job.matchCalculation as Record<string, unknown> | undefined;
      const skillsOverlap = matchCalc?.skillsOverlap as Record<string, unknown> | undefined;
      const toolsOverlap = matchCalc?.toolsOverlap as Record<string, unknown> | undefined;
      const languageFit = matchCalc?.languageFit as Record<string, unknown> | undefined;
      const locationFit = matchCalc?.locationFit as Record<string, unknown> | undefined;

      return {
        jobId: job.id,
        jobTitle: job.title,
        matchScore: job.match_score,
        breakdown: {
          skills: {
            score: Math.round((skillsOverlap?.score as number | undefined || 0) * 100),
            matched: skillsOverlap?.matched || [],
            missing: skillsOverlap?.missing || []
          },
          tools: {
            score: Math.round((toolsOverlap?.score as number | undefined || 0) * 100),
            matched: toolsOverlap?.matched || [],
            missing: toolsOverlap?.missing || []
          },
          language: {
            score: Math.round((languageFit?.score as number | undefined || 0) * 100),
            explanation: languageFit?.explanation || 'Unknown'
          },
          location: {
            score: Math.round((locationFit?.score as number | undefined || 0) * 100),
            explanation: locationFit?.explanation || 'Unknown'
          }
        }
      };
    });
    
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
