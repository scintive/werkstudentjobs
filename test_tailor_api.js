#!/usr/bin/env node

// Test script for the fixed analyze-with-tailoring API endpoint

const testEndpoint = async () => {
  try {
    console.log('🧪 Testing analyze-with-tailoring API endpoint...\n');

    // Test 1: Check if server is running
    console.log('📡 Checking server connectivity...');
    const response = await fetch('http://localhost:3000/api/jobs/analyze-with-tailoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: 'invalid-uuid',
        base_resume_id: 'invalid-uuid'
      })
    });

    console.log(`✅ Server responded with status: ${response.status}`);

    if (response.status === 400) {
      const data = await response.json();
      console.log('✅ Validation error handling works:', data.message);
    } else {
      console.log('⚠️ Unexpected response status for invalid UUIDs');
    }

    // Test 2: Check error structure
    console.log('\n📋 Testing error response structure...');
    const errorResponse = await fetch('http://localhost:3000/api/jobs/analyze-with-tailoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
      })
    });

    if (errorResponse.status === 400) {
      const errorData = await errorResponse.json();
      console.log('✅ Error response structure:', {
        has_code: !!errorData.code,
        has_message: !!errorData.message,
        message: errorData.message
      });
    }

    console.log('\n🎉 Basic API connectivity test completed!');
    console.log('💡 To test with real data, you would need:');
    console.log('   - Valid Supabase JWT token');
    console.log('   - Real job_id and base_resume_id');
    console.log('   - Proper authentication setup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the dev server is running: npm run dev');
  }
};

testEndpoint();

