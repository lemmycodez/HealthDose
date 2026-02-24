/**
 * interactionChecker.ts
 * Drug interaction checking logic
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

interface InteractionRecord {
  id: string;
  severity: string;
  type: string;
  description: string;
  advice: string;
  withMedication?: string;
}

interface MedicationNotFoundResponse {
  found: boolean;
  hasInteraction: boolean;
  medications: {
    requestedA: string;
    requestedB: string;
    foundA: string | null;
    foundB: string | null;
  };
  message?: string;
}

/**
 * Find a medication by name (generic or brand)
 */
async function findMedicationByName(name: string) {
  const nameLower = name.toLowerCase().trim();
  
  const snapshot = await db.collection('medications').get();
  
  let bestMatch: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let bestScore = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const genericName = data.genericName || '';
    const brandNames = data.brandNames || [];
    
    // Check exact match on generic name
    if (genericName.toLowerCase() === nameLower) {
      bestMatch = doc;
      bestScore = 100;
      return;
    }
    
    // Check brand names
    for (const brand of brandNames) {
      if (brand.toLowerCase() === nameLower) {
        bestMatch = doc;
        bestScore = 95;
        return;
      }
    }
    
    // Partial match if no exact found
    if (bestScore < 80) {
      if (genericName.toLowerCase().includes(nameLower)) {
        bestMatch = doc;
        bestScore = 70;
      }
    }
  });
  
  return bestMatch;
}

/**
 * Check interaction between two medications
 */
export async function checkInteraction(drugA: string, drugB: string) {
  console.log(`🔍 Checking: ${drugA} + ${drugB}`);
  
  const [medADoc, medBDoc] = await Promise.all([
    findMedicationByName(drugA),
    findMedicationByName(drugB)
  ]);
  
  if (!medADoc || !medBDoc) {
    const response: MedicationNotFoundResponse = {
      found: false,
      hasInteraction: false,
      medications: {
        requestedA: drugA,
        requestedB: drugB,
        foundA: medADoc ? medADoc.data().genericName : null,
        foundB: medBDoc ? medBDoc.data().genericName : null
      }
    };
    
    if (!medADoc && !medBDoc) {
      response.message = 'Neither medication found';
    } else if (!medADoc) {
      response.message = `"${drugA}" not found`;
    } else {
      response.message = `"${drugB}" not found`;
    }
    
    return response;
  }
  
  const medAData = medADoc.data();
  const medBData = medBDoc.data();
  
  const [interactions1, interactions2] = await Promise.all([
    db.collection('interactions')
      .where('drugA', '==', medADoc.ref)
      .where('drugB', '==', medBDoc.ref)
      .get(),
    db.collection('interactions')
      .where('drugA', '==', medBDoc.ref)
      .where('drugB', '==', medADoc.ref)
      .get()
  ]);
  
  const interactions: InteractionRecord[] = [];
  
  interactions1.forEach(doc => {
    const data = doc.data();
    interactions.push({
      id: doc.id,
      severity: data.severity,
      type: data.interactionType,
      description: data.description,
      advice: data.clinicalManagementAdvice
    });
  });
  
  interactions2.forEach(doc => {
    const data = doc.data();
    interactions.push({
      id: doc.id,
      severity: data.severity,
      type: data.interactionType,
      description: data.description,
      advice: data.clinicalManagementAdvice
    });
  });
  
  let highestSeverity = 'none';
  for (const interaction of interactions) {
    if (interaction.severity === 'severe') {
      highestSeverity = 'severe';
      break;
    }
    if (interaction.severity === 'moderate' && highestSeverity !== 'severe') {
      highestSeverity = 'moderate';
    }
    if (interaction.severity === 'mild' && highestSeverity === 'none') {
      highestSeverity = 'mild';
    }
  }
  
  let summary = '';
  if (interactions.length === 0) {
    summary = `✅ No known interactions between ${medAData.genericName} and ${medBData.genericName}.`;
  } else {
    summary = `⚠️ ${interactions.length} interaction${interactions.length > 1 ? 's' : ''} found. `;
    if (highestSeverity === 'severe') {
      summary += 'This combination may be dangerous.';
    } else if (highestSeverity === 'moderate') {
      summary += 'Use with caution and monitor closely.';
    } else {
      summary += 'Mild interaction possible.';
    }
  }
  
  return {
    found: true,
    hasInteraction: interactions.length > 0,
    highestSeverity,
    medications: {
      a: {
        name: medAData.genericName,
        id: medADoc.id,
        drugClass: medAData.drugClass
      },
      b: {
        name: medBData.genericName,
        id: medBDoc.id,
        drugClass: medBData.drugClass
      }
    },
    interactions,
    summary
  };
}

/**
 * Get all interactions for a medication
 */
export async function getMedicationInteractions(medicationName: string) {
  console.log(`🔍 Getting interactions for: ${medicationName}`);
  
  const medDoc = await findMedicationByName(medicationName);
  
  if (!medDoc) {
    return {
      found: false,
      message: `"${medicationName}" not found`,
      interactions: []
    };
  }
  
  const medData = medDoc.data();
  
  const [asDrugA, asDrugB] = await Promise.all([
    db.collection('interactions').where('drugA', '==', medDoc.ref).get(),
    db.collection('interactions').where('drugB', '==', medDoc.ref).get()
  ]);
  
  const interactions: InteractionRecord[] = [];
  
  for (const doc of asDrugA.docs) {
    const data = doc.data();
    const otherMed = await data.drugB.get();
    const otherData = otherMed.data();
    
    interactions.push({
      id: doc.id,
      withMedication: otherData.genericName,
      severity: data.severity,
      type: data.interactionType,
      description: data.description,
      advice: data.clinicalManagementAdvice
    });
  }
  
  for (const doc of asDrugB.docs) {
    const data = doc.data();
    const otherMed = await data.drugA.get();
    const otherData = otherMed.data();
    
    interactions.push({
      id: doc.id,
      withMedication: otherData.genericName,
      severity: data.severity,
      type: data.interactionType,
      description: data.description,
      advice: data.clinicalManagementAdvice
    });
  }
  
  const severityRank: Record<string, number> = { 'severe': 3, 'moderate': 2, 'mild': 1 };
  interactions.sort((a, b) => 
    (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
  );
  
  return {
    found: true,
    medication: medData.genericName,
    totalInteractions: interactions.length,
    interactions
  };
}