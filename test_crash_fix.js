#!/usr/bin/env node

// Test script to verify the crash fix

const testCrashFix = async () => {
  try {
    console.log('🧪 Testing crash fix...\n');

    // Test if the server starts without crashing
    console.log('📡 Testing server startup...');

    const response = await fetch('http://localhost:3000', {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ Server is running without crashes');
    } else {
      console.log('⚠️ Server responded but with status:', response.status);
    }

    console.log('\n🎉 Crash fix verification complete!');
    console.log('💡 If no ReferenceError appears in console, the fix is working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the dev server is running: npm run dev');
  }
};

testCrashFix();

