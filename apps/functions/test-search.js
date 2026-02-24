/**
 * test-search.js
 * Simple test for search functionality
 */

const { searchMedications } = require('./lib/searchMedications');

// Mock Firebase for testing
const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

async function runTests() {
  console.log('🧪 TESTING MEDICATION SEARCH');
  console.log('=' .repeat(50));
  
  const testTerms = ['ibu', 'warf', 'amox', 'tylenol', 'vitamin'];
  
  for (const term of testTerms) {
    console.log(`\n🔍 Testing: "${term}"`);
    console.log('-'.repeat(30));
    
    try {
      const results = await searchMedications(term, 5);
      console.log(`✅ Found ${results.count} matches`);
      
      results.results.forEach((med, i) => {
        console.log(`   ${i+1}. ${med.genericName}`);
        if (med.brandNames && med.brandNames.length) {
          console.log(`      Brands: ${med.brandNames.slice(0, 2).join(', ')}`);
        }
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Tests complete!');
}

// Only run if called directly
if (require.main === module) {
  runTests();
}