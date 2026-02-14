/**
 * searchMedications.ts
 * Handles medication search functionality
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Search medications by name (generic or brand)
 */
export async function searchMedications(searchTerm: string, maxResults: number = 20) {
  console.log(`🔍 Searching for: "${searchTerm}"`);
  
  if (!searchTerm || searchTerm.length < 2) {
    return {
      searchTerm,
      count: 0,
      results: []
    };
  }
  
  const searchTermLower = searchTerm.toLowerCase().trim();
  
  // Get all medications
  const snapshot = await db.collection('medications')
    .limit(100)
    .get();
  
  const results: Array<{ id: string; genericName: string; brandNames: string[]; drugClass: string; relevance: number }> = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const genericName = data.genericName || '';
    const brandNames = data.brandNames || [];
    const genericLower = genericName.toLowerCase();
    
    let relevance = 0;
    
    // Check generic name
    if (genericLower === searchTermLower) {
      relevance = 100;
    } else if (genericLower.startsWith(searchTermLower)) {
      relevance = 90;
    } else if (genericLower.includes(searchTermLower)) {
      relevance = 80;
    }
    
    // Check brand names
    for (const brand of brandNames) {
      const brandLower = brand.toLowerCase();
      if (brandLower === searchTermLower) {
        relevance = Math.max(relevance, 95);
      } else if (brandLower.startsWith(searchTermLower)) {
        relevance = Math.max(relevance, 85);
      } else if (brandLower.includes(searchTermLower)) {
        relevance = Math.max(relevance, 75);
      }
    }
    
    if (relevance > 0) {
      results.push({
        id: doc.id,
        genericName: genericName,
        brandNames: brandNames,
        drugClass: data.drugClass || 'Unknown',
        relevance: relevance
      });
    }
  });
  
  results.sort((a, b) => b.relevance - a.relevance);
  const limitedResults = results.slice(0, maxResults);
  
  return {
    searchTerm: searchTerm,
    totalMatches: results.length,
    count: limitedResults.length,
    results: limitedResults.map(r => ({
      id: r.id,
      genericName: r.genericName,
      brandNames: r.brandNames,
      drugClass: r.drugClass
    }))
  };
}

/**
 * Get a single medication by ID
 */
export async function getMedicationById(medicationId: string) {
  try {
    const doc = await db.collection('medications').doc(medicationId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting medication:', error);
    return null;
  }
}

/**
 * Get multiple medications by IDs
 */
export async function getMedicationsByIds(medicationIds: string[]) {
  if (!medicationIds.length) return [];
  
  try {
    const docs = await Promise.all(
      medicationIds.map(id => db.collection('medications').doc(id).get())
    );
    
    return docs
      .filter(doc => doc.exists)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
}