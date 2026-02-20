import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * HealthDose Seeding Script
 * Milestone 2: Core Database Implementation
 * Uses ADC (Application Default Credentials)
 */

initializeApp({
  projectId: 'med-assist-9edf0' // Your verified Project ID
});

const db = getFirestore();

async function seedHealthData() {
  console.log('💊 Starting HealthDose Data Seed...');

  const medications = [
    { 
      name: 'Ibuprofen', 
      id: 'med_01', 
      type: 'NSAID', 
      interactions: ['Aspirin'], 
      advice: 'Take with food to protect your stomach.' 
    },
    { 
      name: 'Aspirin', 
      id: 'med_02', 
      type: 'Analgesic', 
      interactions: ['Ibuprofen', 'Warfarin'], 
      advice: 'Avoid alcohol while taking this medication.' 
    },
    { 
      name: 'Amoxicillin', 
      id: 'med_03', 
      type: 'Antibiotic', 
      interactions: [], 
      advice: 'Complete the full course even if you feel better.' 
    }
  ];

  try {
    for (const med of medications) {
      await db.collection('medications').doc(med.id).set(med);
      console.log(`✅ Seeded Medication: ${med.name}`);
    }
    console.log('✨ Success! Your Firestore is now populated.');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedHealthData();