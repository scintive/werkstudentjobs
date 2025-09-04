import { NextRequest, NextResponse } from 'next/server';
import { fastMatchingService } from '@/lib/services/fastMatchingService';
import type { JobWithCompany } from '@/lib/supabase/types';
import type { UserProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userProfile, jobs } = await request.json();
    
    if (!userProfile || !jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Invalid request: userProfile and jobs array are required' },
        { status: 400 }
      );
    }
    
    if (jobs.length === 0) {
      return NextResponse.json({ matchedJobs: [] });
    }
    
    console.log('🎯 Starting FAST matching for', jobs.length, 'jobs');
    console.log('🎯 Research-based Weights: Skills 50%, Tools 20%, Experience 15%, Language 10%, Location 5%');
    
    // Use the fast matching service with TF-IDF and cosine similarity
    const matchedJobsWithDetails = await fastMatchingService.calculateBatchMatches(jobs, userProfile);
    
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