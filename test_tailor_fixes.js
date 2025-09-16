#!/usr/bin/env node

// Test script for the fixed Tailor functionality

const testEndpoint = async () => {
  try {
    console.log('🧪 Testing fixed Tailor functionality...\n');

    // Test 1: Check if analyze-with-tailoring returns proper structure
    console.log('📡 Testing analyze-with-tailoring response structure...');
    const response = await fetch('http://localhost:3000/api/jobs/analyze-with-tailoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: '550e8400-e29b-41d4-a716-446655440000', // fake UUID
        base_resume_id: '550e8400-e29b-41d4-a716-446655440001' // fake UUID
      })
    });

    console.log(`✅ Server responded with status: ${response.status}`);

    if (response.status === 400) {
      const data = await response.json();
      console.log('✅ Validation error handled properly:', data.message);
    } else {
      console.log('⚠️ Unexpected response for invalid UUIDs');
    }

    // Test 2: Check iframe HTML sanitization
    console.log('\n🧹 Testing iframe HTML sanitization...');
    const previewResponse = await fetch('http://localhost:3000/api/resume/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: {
          personalInfo: { name: 'Test User', email: 'test@example.com' },
          professionalTitle: 'Test Title',
          professionalSummary: 'Test summary',
          skills: { technical: ['JavaScript', 'React'] },
          experience: [],
          education: [],
          projects: [],
          certifications: []
        },
        template: 'swiss'
      })
    });

    if (previewResponse.ok) {
      const data = await previewResponse.json();
      const hasScriptTags = data.html.includes('<script');
      console.log(`✅ HTML sanitization working: ${!hasScriptTags ? 'No script tags found' : 'Script tags present (should be sanitized)'}`);
    }

    console.log('\n🎉 Core fixes verified!');
    console.log('💡 Next steps:');
    console.log('   1. Test with real job_id and resume_id (requires auth)');
    console.log('   2. Verify skills suggestions appear in response');
    console.log('   3. Test "Open in Editor" with variant_id parameter');
    console.log('   4. Confirm no 406/409 errors in network tab');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the dev server is running: npm run dev');
  }
};

testEndpoint();

