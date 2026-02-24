/**
 * test-ai.ts
 * Simple test to verify Vertex AI is working
 */

import { testAiConnection } from './ai-config.js';

async function runTest() {
  console.log('🤖 Testing Vertex AI connection...');
  console.log('=' .repeat(50));
  
  const result = await testAiConnection();
  
  if (result.success) {
    console.log('✅ SUCCESS! AI is working!');
    console.log(`Response: ${result.response}`);
  } else {
    console.log('❌ FAILED:', result.error);
  }
  
  console.log('=' .repeat(50));
}

// Run the test
runTest();