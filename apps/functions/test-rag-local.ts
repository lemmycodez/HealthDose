/**
 * test-rag-local.ts
 * Local test for RAG query function
 */

import * as admin from 'firebase-admin';
import { testRagQueries } from './ragQuery';

// Initialize Firebase Admin for local testing
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'med-assist-9edf0',
  credential: admin.credential.applicationDefault()
});

console.log('🚀 Starting RAG local tests...');

// Run the tests
testRagQueries().then(() => {
  console.log('\n✨ Tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});