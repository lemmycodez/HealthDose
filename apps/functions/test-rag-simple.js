/**
 * test-rag-simple.js
 * Simple test that uses the compiled JavaScript
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'med-assist-9edf0',
  credential: admin.credential.applicationDefault()
});

// Import the compiled function
const { testRagQueries } = require('./lib/ragQuery');

console.log('🚀 Testing RAG queries with compiled JS...');

testRagQueries()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });